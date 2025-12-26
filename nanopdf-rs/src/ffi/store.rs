//! C FFI for resource store/caching - MuPDF compatible
//! Safe Rust implementation of fz_store

use super::Handle;
use std::collections::HashMap;
use std::sync::{LazyLock, Mutex, atomic::{AtomicUsize, Ordering}};
use std::time::{Instant, Duration};

/// Store item type enumeration
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum StoreType {
    /// Generic/unknown type
    Generic = 0,
    /// Font data
    Font = 1,
    /// Image/pixmap
    Image = 2,
    /// Colorspace
    Colorspace = 3,
    /// Path data
    Path = 4,
    /// Shade/gradient
    Shade = 5,
    /// Glyph cache
    Glyph = 6,
    /// Display list
    DisplayList = 7,
    /// Document
    Document = 8,
    /// Page
    Page = 9,
}

/// Cache eviction policy
#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvictionPolicy {
    /// Least Recently Used
    LRU = 0,
    /// Least Frequently Used
    LFU = 1,
    /// First In First Out
    FIFO = 2,
    /// Random eviction
    Random = 3,
}

/// Store item metadata
#[derive(Debug, Clone)]
pub struct StoreItem {
    /// Item type
    pub item_type: StoreType,
    /// Handle to the stored resource
    pub handle: Handle,
    /// Size in bytes
    pub size: usize,
    /// Last access time
    pub last_access: Instant,
    /// Access count
    pub access_count: u64,
    /// Creation time
    pub created: Instant,
    /// Custom key data
    pub key: Vec<u8>,
    /// Whether item is evictable
    pub evictable: bool,
    /// Reference count
    pub refs: u32,
}

impl Default for StoreItem {
    fn default() -> Self {
        Self {
            item_type: StoreType::Generic,
            handle: 0,
            size: 0,
            last_access: Instant::now(),
            access_count: 0,
            created: Instant::now(),
            key: Vec::new(),
            evictable: true,
            refs: 1,
        }
    }
}

/// Resource store structure
#[derive(Debug)]
pub struct Store {
    /// Maximum size in bytes
    pub max_size: usize,
    /// Current size in bytes
    pub current_size: usize,
    /// Items in store (key -> item)
    pub items: HashMap<u64, StoreItem>,
    /// Key to handle mapping
    pub key_map: HashMap<Vec<u8>, u64>,
    /// Eviction policy
    pub policy: EvictionPolicy,
    /// Total items ever stored
    pub total_stored: u64,
    /// Total items evicted
    pub total_evicted: u64,
    /// Cache hits
    pub hits: u64,
    /// Cache misses
    pub misses: u64,
    /// Per-type limits (0 = no limit)
    pub type_limits: HashMap<StoreType, usize>,
    /// Per-type current sizes
    pub type_sizes: HashMap<StoreType, usize>,
}

impl Default for Store {
    fn default() -> Self {
        Self {
            max_size: 256 * 1024 * 1024, // 256 MB default
            current_size: 0,
            items: HashMap::new(),
            key_map: HashMap::new(),
            policy: EvictionPolicy::LRU,
            total_stored: 0,
            total_evicted: 0,
            hits: 0,
            misses: 0,
            type_limits: HashMap::new(),
            type_sizes: HashMap::new(),
        }
    }
}

/// Global store instance
pub static STORE: LazyLock<Mutex<Store>> = LazyLock::new(|| Mutex::new(Store::default()));

/// Counter for store item IDs
static STORE_ID_COUNTER: AtomicUsize = AtomicUsize::new(1);

/// Generate a new store item ID
fn new_store_id() -> u64 {
    STORE_ID_COUNTER.fetch_add(1, Ordering::SeqCst) as u64
}

// ============================================================================
// Store Creation and Configuration
// ============================================================================

/// Create a new store with specified maximum size
#[unsafe(no_mangle)]
pub extern "C" fn fz_new_store(_ctx: Handle, max_size: usize) -> i32 {
    if let Ok(mut store) = STORE.lock() {
        store.max_size = max_size;
        store.items.clear();
        store.key_map.clear();
        store.current_size = 0;
        store.total_stored = 0;
        store.total_evicted = 0;
        store.hits = 0;
        store.misses = 0;
        return 1;
    }
    0
}

/// Set store maximum size
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_set_max_size(_ctx: Handle, max_size: usize) {
    if let Ok(mut store) = STORE.lock() {
        store.max_size = max_size;
        // Evict if over new limit
        evict_to_size(&mut store, max_size);
    }
}

/// Get store maximum size
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_max_size(_ctx: Handle) -> usize {
    if let Ok(store) = STORE.lock() {
        return store.max_size;
    }
    0
}

/// Get current store size (bytes used)
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_current_size(_ctx: Handle) -> usize {
    if let Ok(store) = STORE.lock() {
        return store.current_size;
    }
    0
}

/// Set eviction policy
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_set_policy(_ctx: Handle, policy: i32) {
    let p = match policy {
        1 => EvictionPolicy::LFU,
        2 => EvictionPolicy::FIFO,
        3 => EvictionPolicy::Random,
        _ => EvictionPolicy::LRU,
    };
    
    if let Ok(mut store) = STORE.lock() {
        store.policy = p;
    }
}

/// Set per-type size limit
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_set_type_limit(_ctx: Handle, item_type: i32, max_size: usize) {
    let t = match item_type {
        1 => StoreType::Font,
        2 => StoreType::Image,
        3 => StoreType::Colorspace,
        4 => StoreType::Path,
        5 => StoreType::Shade,
        6 => StoreType::Glyph,
        7 => StoreType::DisplayList,
        8 => StoreType::Document,
        9 => StoreType::Page,
        _ => StoreType::Generic,
    };
    
    if let Ok(mut store) = STORE.lock() {
        if max_size > 0 {
            store.type_limits.insert(t, max_size);
        } else {
            store.type_limits.remove(&t);
        }
    }
}

// ============================================================================
// Store Items
// ============================================================================

/// Store an item
///
/// # Safety
/// `key` must point to valid memory of `key_len` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_item(
    _ctx: Handle,
    item_type: i32,
    handle: Handle,
    size: usize,
    key: *const u8,
    key_len: usize,
) -> u64 {
    let t = match item_type {
        1 => StoreType::Font,
        2 => StoreType::Image,
        3 => StoreType::Colorspace,
        4 => StoreType::Path,
        5 => StoreType::Shade,
        6 => StoreType::Glyph,
        7 => StoreType::DisplayList,
        8 => StoreType::Document,
        9 => StoreType::Page,
        _ => StoreType::Generic,
    };
    
    let key_data = if key.is_null() || key_len == 0 {
        Vec::new()
    } else {
        unsafe { std::slice::from_raw_parts(key, key_len) }.to_vec()
    };
    
    if let Ok(mut store) = STORE.lock() {
        // Check if we need to evict items first
        if store.current_size + size > store.max_size {
            let target_size = store.max_size.saturating_sub(size);
            evict_to_size(&mut store, target_size);
        }
        
        // Check type limit
        if let Some(&limit) = store.type_limits.get(&t) {
            let current = store.type_sizes.get(&t).copied().unwrap_or(0);
            if current + size > limit {
                evict_type_to_size(&mut store, t, limit.saturating_sub(size));
            }
        }
        
        // Generate item ID
        let id = new_store_id();
        
        // Create item
        let item = StoreItem {
            item_type: t,
            handle,
            size,
            last_access: Instant::now(),
            access_count: 0,
            created: Instant::now(),
            key: key_data.clone(),
            evictable: true,
            refs: 1,
        };
        
        // Update size tracking
        store.current_size += size;
        *store.type_sizes.entry(t).or_insert(0) += size;
        
        // Store item
        store.items.insert(id, item);
        if !key_data.is_empty() {
            store.key_map.insert(key_data, id);
        }
        
        store.total_stored += 1;
        
        return id;
    }
    
    0
}

/// Look up an item by key
///
/// # Safety
/// `key` must point to valid memory of `key_len` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_find(
    _ctx: Handle,
    key: *const u8,
    key_len: usize,
) -> Handle {
    if key.is_null() || key_len == 0 {
        return 0;
    }
    
    let key_data = unsafe { std::slice::from_raw_parts(key, key_len) };
    
    if let Ok(mut store) = STORE.lock() {
        if let Some(&id) = store.key_map.get(key_data) {
            let result = if let Some(item) = store.items.get_mut(&id) {
                // Update access tracking
                item.last_access = Instant::now();
                item.access_count += 1;
                Some(item.handle)
            } else {
                None
            };
            
            if let Some(handle) = result {
                store.hits += 1;
                return handle;
            }
        }
        store.misses += 1;
    }
    
    0
}

/// Look up item by store ID
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_find_by_id(_ctx: Handle, id: u64) -> Handle {
    if let Ok(mut store) = STORE.lock() {
        let result = if let Some(item) = store.items.get_mut(&id) {
            item.last_access = Instant::now();
            item.access_count += 1;
            Some(item.handle)
        } else {
            None
        };
        
        if let Some(handle) = result {
            store.hits += 1;
            return handle;
        }
        store.misses += 1;
    }
    0
}

/// Remove an item from the store by ID
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_remove(_ctx: Handle, id: u64) -> Handle {
    if let Ok(mut store) = STORE.lock() {
        if let Some(item) = store.items.remove(&id) {
            // Remove from key map
            if !item.key.is_empty() {
                store.key_map.remove(&item.key);
            }
            
            // Update sizes
            store.current_size = store.current_size.saturating_sub(item.size);
            if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                *type_size = type_size.saturating_sub(item.size);
            }
            
            return item.handle;
        }
    }
    0
}

/// Remove item by key
///
/// # Safety
/// `key` must point to valid memory of `key_len` bytes.
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_remove_by_key(
    _ctx: Handle,
    key: *const u8,
    key_len: usize,
) -> Handle {
    if key.is_null() || key_len == 0 {
        return 0;
    }
    
    let key_data = unsafe { std::slice::from_raw_parts(key, key_len) };
    
    if let Ok(mut store) = STORE.lock() {
        if let Some(id) = store.key_map.remove(key_data) {
            if let Some(item) = store.items.remove(&id) {
                store.current_size = store.current_size.saturating_sub(item.size);
                if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                    *type_size = type_size.saturating_sub(item.size);
                }
                return item.handle;
            }
        }
    }
    0
}

/// Keep (increment reference to) store item
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_keep(_ctx: Handle, id: u64) -> u64 {
    if let Ok(mut store) = STORE.lock() {
        if let Some(item) = store.items.get_mut(&id) {
            item.refs = item.refs.saturating_add(1);
            return id;
        }
    }
    0
}

/// Drop reference to store item
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_drop(_ctx: Handle, id: u64) {
    if let Ok(mut store) = STORE.lock() {
        let should_remove = {
            if let Some(item) = store.items.get_mut(&id) {
                item.refs = item.refs.saturating_sub(1);
                item.refs == 0
            } else {
                false
            }
        };
        
        if should_remove {
            if let Some(item) = store.items.remove(&id) {
                if !item.key.is_empty() {
                    store.key_map.remove(&item.key);
                }
                store.current_size = store.current_size.saturating_sub(item.size);
                if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                    *type_size = type_size.saturating_sub(item.size);
                }
            }
        }
    }
}

// ============================================================================
// Item Properties
// ============================================================================

/// Set whether an item is evictable
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_set_evictable(_ctx: Handle, id: u64, evictable: i32) {
    if let Ok(mut store) = STORE.lock() {
        if let Some(item) = store.items.get_mut(&id) {
            item.evictable = evictable != 0;
        }
    }
}

/// Get item size
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_item_size(_ctx: Handle, id: u64) -> usize {
    if let Ok(store) = STORE.lock() {
        if let Some(item) = store.items.get(&id) {
            return item.size;
        }
    }
    0
}

/// Get item type
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_item_type(_ctx: Handle, id: u64) -> i32 {
    if let Ok(store) = STORE.lock() {
        if let Some(item) = store.items.get(&id) {
            return item.item_type as i32;
        }
    }
    0
}

/// Get item access count
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_item_access_count(_ctx: Handle, id: u64) -> u64 {
    if let Ok(store) = STORE.lock() {
        if let Some(item) = store.items.get(&id) {
            return item.access_count;
        }
    }
    0
}

/// Get item age in milliseconds
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_item_age(_ctx: Handle, id: u64) -> u64 {
    if let Ok(store) = STORE.lock() {
        if let Some(item) = store.items.get(&id) {
            return item.created.elapsed().as_millis() as u64;
        }
    }
    0
}

// ============================================================================
// Store Statistics
// ============================================================================

/// Get number of items in store
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_count(_ctx: Handle) -> usize {
    if let Ok(store) = STORE.lock() {
        return store.items.len();
    }
    0
}

/// Get number of cache hits
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_hits(_ctx: Handle) -> u64 {
    if let Ok(store) = STORE.lock() {
        return store.hits;
    }
    0
}

/// Get number of cache misses
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_misses(_ctx: Handle) -> u64 {
    if let Ok(store) = STORE.lock() {
        return store.misses;
    }
    0
}

/// Get hit rate (0.0 to 1.0)
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_hit_rate(_ctx: Handle) -> f32 {
    if let Ok(store) = STORE.lock() {
        let total = store.hits + store.misses;
        if total == 0 {
            return 0.0;
        }
        return store.hits as f32 / total as f32;
    }
    0.0
}

/// Get total items ever stored
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_total_stored(_ctx: Handle) -> u64 {
    if let Ok(store) = STORE.lock() {
        return store.total_stored;
    }
    0
}

/// Get total items evicted
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_total_evicted(_ctx: Handle) -> u64 {
    if let Ok(store) = STORE.lock() {
        return store.total_evicted;
    }
    0
}

/// Get size of specific type
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_type_size(_ctx: Handle, item_type: i32) -> usize {
    let t = match item_type {
        1 => StoreType::Font,
        2 => StoreType::Image,
        3 => StoreType::Colorspace,
        4 => StoreType::Path,
        5 => StoreType::Shade,
        6 => StoreType::Glyph,
        7 => StoreType::DisplayList,
        8 => StoreType::Document,
        9 => StoreType::Page,
        _ => StoreType::Generic,
    };
    
    if let Ok(store) = STORE.lock() {
        return store.type_sizes.get(&t).copied().unwrap_or(0);
    }
    0
}

/// Get count of specific type
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_type_count(_ctx: Handle, item_type: i32) -> usize {
    let t = match item_type {
        1 => StoreType::Font,
        2 => StoreType::Image,
        3 => StoreType::Colorspace,
        4 => StoreType::Path,
        5 => StoreType::Shade,
        6 => StoreType::Glyph,
        7 => StoreType::DisplayList,
        8 => StoreType::Document,
        9 => StoreType::Page,
        _ => StoreType::Generic,
    };
    
    if let Ok(store) = STORE.lock() {
        return store.items.values().filter(|i| i.item_type == t).count();
    }
    0
}

// ============================================================================
// Eviction
// ============================================================================

/// Internal: evict items to reach target size
fn evict_to_size(store: &mut Store, target_size: usize) {
    while store.current_size > target_size && !store.items.is_empty() {
        let victim_id = select_victim(store);
        if victim_id == 0 {
            break;
        }
        
        if let Some(item) = store.items.remove(&victim_id) {
            if !item.key.is_empty() {
                store.key_map.remove(&item.key);
            }
            store.current_size = store.current_size.saturating_sub(item.size);
            if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                *type_size = type_size.saturating_sub(item.size);
            }
            store.total_evicted += 1;
        }
    }
}

/// Internal: evict items of specific type to reach target size
fn evict_type_to_size(store: &mut Store, item_type: StoreType, target_size: usize) {
    let current = store.type_sizes.get(&item_type).copied().unwrap_or(0);
    if current <= target_size {
        return;
    }
    
    // Collect victims
    let mut victims: Vec<u64> = store
        .items
        .iter()
        .filter(|(_, item)| item.item_type == item_type && item.evictable && item.refs <= 1)
        .map(|(&id, _)| id)
        .collect();
    
    // Sort by eviction policy
    victims.sort_by(|&a, &b| {
        let item_a = store.items.get(&a).unwrap();
        let item_b = store.items.get(&b).unwrap();
        match store.policy {
            EvictionPolicy::LRU => item_a.last_access.cmp(&item_b.last_access),
            EvictionPolicy::LFU => item_a.access_count.cmp(&item_b.access_count),
            EvictionPolicy::FIFO => item_a.created.cmp(&item_b.created),
            EvictionPolicy::Random => std::cmp::Ordering::Equal,
        }
    });
    
    // Evict until under target
    let mut evicted_size = 0;
    let needed = current.saturating_sub(target_size);
    
    for victim_id in victims {
        if evicted_size >= needed {
            break;
        }
        
        if let Some(item) = store.items.remove(&victim_id) {
            if !item.key.is_empty() {
                store.key_map.remove(&item.key);
            }
            evicted_size += item.size;
            store.current_size = store.current_size.saturating_sub(item.size);
            if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                *type_size = type_size.saturating_sub(item.size);
            }
            store.total_evicted += 1;
        }
    }
}

/// Internal: select victim for eviction based on policy
fn select_victim(store: &Store) -> u64 {
    let evictable: Vec<_> = store
        .items
        .iter()
        .filter(|(_, item)| item.evictable && item.refs <= 1)
        .collect();
    
    if evictable.is_empty() {
        return 0;
    }
    
    match store.policy {
        EvictionPolicy::LRU => {
            evictable
                .iter()
                .min_by_key(|(_, item)| item.last_access)
                .map(|(id, _)| **id)
                .unwrap_or(0)
        }
        EvictionPolicy::LFU => {
            evictable
                .iter()
                .min_by_key(|(_, item)| item.access_count)
                .map(|(id, _)| **id)
                .unwrap_or(0)
        }
        EvictionPolicy::FIFO => {
            evictable
                .iter()
                .min_by_key(|(_, item)| item.created)
                .map(|(id, _)| **id)
                .unwrap_or(0)
        }
        EvictionPolicy::Random => {
            // Use simple deterministic selection for reproducibility
            evictable.first().map(|(id, _)| **id).unwrap_or(0)
        }
    }
}

/// Manually trigger eviction
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_evict(_ctx: Handle, target_size: usize) -> usize {
    if let Ok(mut store) = STORE.lock() {
        let before = store.items.len();
        evict_to_size(&mut store, target_size);
        return before - store.items.len();
    }
    0
}

/// Evict all items of a specific type
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_evict_type(_ctx: Handle, item_type: i32) -> usize {
    let t = match item_type {
        1 => StoreType::Font,
        2 => StoreType::Image,
        3 => StoreType::Colorspace,
        4 => StoreType::Path,
        5 => StoreType::Shade,
        6 => StoreType::Glyph,
        7 => StoreType::DisplayList,
        8 => StoreType::Document,
        9 => StoreType::Page,
        _ => StoreType::Generic,
    };
    
    if let Ok(mut store) = STORE.lock() {
        let before = store.items.len();
        evict_type_to_size(&mut store, t, 0);
        return before - store.items.len();
    }
    0
}

/// Evict items older than specified age (milliseconds)
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_evict_old(_ctx: Handle, max_age_ms: u64) -> usize {
    if let Ok(mut store) = STORE.lock() {
        let max_age = Duration::from_millis(max_age_ms);
        let now = Instant::now();
        
        let victims: Vec<u64> = store
            .items
            .iter()
            .filter(|(_, item)| {
                item.evictable && item.refs <= 1 && 
                now.duration_since(item.last_access) > max_age
            })
            .map(|(&id, _)| id)
            .collect();
        
        let count = victims.len();
        
        for id in victims {
            if let Some(item) = store.items.remove(&id) {
                if !item.key.is_empty() {
                    store.key_map.remove(&item.key);
                }
                store.current_size = store.current_size.saturating_sub(item.size);
                if let Some(type_size) = store.type_sizes.get_mut(&item.item_type) {
                    *type_size = type_size.saturating_sub(item.size);
                }
                store.total_evicted += 1;
            }
        }
        
        return count;
    }
    0
}

/// Clear all items from store
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_clear(_ctx: Handle) {
    if let Ok(mut store) = STORE.lock() {
        let count = store.items.len() as u64;
        store.items.clear();
        store.key_map.clear();
        store.current_size = 0;
        store.type_sizes.clear();
        store.total_evicted += count;
    }
}

/// Reset store statistics
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_reset_stats(_ctx: Handle) {
    if let Ok(mut store) = STORE.lock() {
        store.hits = 0;
        store.misses = 0;
        store.total_stored = 0;
        store.total_evicted = 0;
    }
}

// ============================================================================
// Debugging
// ============================================================================

/// Debug: print store contents (for testing)
#[unsafe(no_mangle)]
pub extern "C" fn fz_store_debug(_ctx: Handle) {
    if let Ok(store) = STORE.lock() {
        eprintln!("Store: {} items, {} / {} bytes", 
            store.items.len(), 
            store.current_size, 
            store.max_size
        );
        eprintln!("  Hits: {}, Misses: {}, Rate: {:.1}%",
            store.hits, 
            store.misses,
            fz_store_hit_rate(0) * 100.0
        );
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() {
        // Reset store for each test
        if let Ok(mut store) = STORE.lock() {
            store.items.clear();
            store.key_map.clear();
            store.current_size = 0;
            store.type_sizes.clear();
            store.hits = 0;
            store.misses = 0;
            store.max_size = 1024 * 1024; // 1MB
        }
    }

    #[test]
    fn test_store_item() {
        setup();
        
        let key = b"test_key";
        let id = fz_store_item(0, 2, 100, 1024, key.as_ptr(), key.len());
        
        assert!(id > 0);
        assert_eq!(fz_store_count(0), 1);
        assert_eq!(fz_store_current_size(0), 1024);
    }

    #[test]
    fn test_store_find() {
        setup();
        
        let key = b"find_test";
        let handle: Handle = 42;
        
        fz_store_item(0, 1, handle, 100, key.as_ptr(), key.len());
        
        let found = fz_store_find(0, key.as_ptr(), key.len());
        assert_eq!(found, handle);
        
        assert_eq!(fz_store_hits(0), 1);
    }

    #[test]
    fn test_store_miss() {
        setup();
        
        let key = b"nonexistent";
        let found = fz_store_find(0, key.as_ptr(), key.len());
        
        assert_eq!(found, 0);
        assert_eq!(fz_store_misses(0), 1);
    }

    #[test]
    fn test_store_eviction() {
        setup();
        fz_store_set_max_size(0, 500);
        
        // Add items that exceed limit
        for i in 0..10 {
            let key = format!("key_{}", i);
            fz_store_item(0, 2, i as Handle, 100, key.as_ptr(), key.len());
        }
        
        // Should have evicted some items
        assert!(fz_store_current_size(0) <= 500);
        assert!(fz_store_total_evicted(0) > 0);
    }

    #[test]
    fn test_store_remove() {
        setup();
        
        let key = b"remove_test";
        let handle: Handle = 99;
        let id = fz_store_item(0, 1, handle, 50, key.as_ptr(), key.len());
        
        assert_eq!(fz_store_count(0), 1);
        
        let removed = fz_store_remove(0, id);
        assert_eq!(removed, handle);
        assert_eq!(fz_store_count(0), 0);
    }

    #[test]
    fn test_store_type_tracking() {
        setup();
        
        let key1 = b"font1";
        let key2 = b"image1";
        
        fz_store_item(0, 1, 1, 100, key1.as_ptr(), key1.len()); // Font
        fz_store_item(0, 2, 2, 200, key2.as_ptr(), key2.len()); // Image
        
        assert_eq!(fz_store_type_size(0, 1), 100); // Font size
        assert_eq!(fz_store_type_size(0, 2), 200); // Image size
        assert_eq!(fz_store_type_count(0, 1), 1);
        assert_eq!(fz_store_type_count(0, 2), 1);
    }

    #[test]
    fn test_store_clear() {
        setup();
        
        for i in 0..5 {
            let key = format!("clear_{}", i);
            fz_store_item(0, 0, i as Handle, 10, key.as_ptr(), key.len());
        }
        
        assert_eq!(fz_store_count(0), 5);
        
        fz_store_clear(0);
        
        assert_eq!(fz_store_count(0), 0);
        assert_eq!(fz_store_current_size(0), 0);
    }

    #[test]
    fn test_hit_rate() {
        setup();
        
        let key = b"hit_rate";
        fz_store_item(0, 0, 1, 10, key.as_ptr(), key.len());
        
        // 2 hits
        fz_store_find(0, key.as_ptr(), key.len());
        fz_store_find(0, key.as_ptr(), key.len());
        
        // 1 miss
        let miss_key = b"miss";
        fz_store_find(0, miss_key.as_ptr(), miss_key.len());
        
        let rate = fz_store_hit_rate(0);
        assert!((rate - 0.666).abs() < 0.01); // ~66.6% hit rate
    }

    #[test]
    fn test_non_evictable() {
        setup();
        fz_store_set_max_size(0, 200);
        
        let key1 = b"pinned";
        let id1 = fz_store_item(0, 0, 1, 150, key1.as_ptr(), key1.len());
        fz_store_set_evictable(0, id1, 0); // Mark as non-evictable
        
        // Try to add item that would require eviction
        let key2 = b"new";
        fz_store_item(0, 0, 2, 100, key2.as_ptr(), key2.len());
        
        // Pinned item should still be there
        let found = fz_store_find(0, key1.as_ptr(), key1.len());
        assert_eq!(found, 1);
    }
}

