/**
 * Simple test script to verify native addon loads and basic FFI works
 */

try {
    console.log('Loading native addon...');
    const addon = require('./build/Release/nanopdf.node');
    
    console.log('✅ Native addon loaded successfully');
    console.log('Available functions:', Object.keys(addon));
    
    console.log('\n📦 Testing version...');
    const version = addon.getVersion();
    console.log('Version:', version);
    
    console.log('\n🔧 Testing context creation...');
    const ctx = addon.createContext();
    console.log('Context created:', ctx);
    
    console.log('\n✅ All basic tests passed!');
    console.log('\nNext: Test document opening and rendering');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}

