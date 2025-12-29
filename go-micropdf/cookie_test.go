package micropdf

import (
	"testing"
)

func TestCookieCreate(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	cookie := NewCookie(ctx)
	if cookie == nil {
		t.Fatal("Failed to create cookie")
	}
	defer cookie.Drop()

	// Initial progress should be 0
	if progress := cookie.Progress(); progress != 0 {
		t.Errorf("Initial progress = %d, expected 0", progress)
	}

	// Should not be aborted initially
	if cookie.IsAborted() {
		t.Error("Cookie should not be aborted initially")
	}
}

func TestCookieAbort(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	cookie := NewCookie(ctx)
	if cookie == nil {
		t.Fatal("Failed to create cookie")
	}
	defer cookie.Drop()

	// Abort the cookie
	cookie.Abort()

	// Should be aborted now
	if !cookie.IsAborted() {
		t.Error("Cookie should be aborted after calling Abort()")
	}
}

func TestCookieReset(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	cookie := NewCookie(ctx)
	if cookie == nil {
		t.Fatal("Failed to create cookie")
	}
	defer cookie.Drop()

	// Abort the cookie
	cookie.Abort()
	if !cookie.IsAborted() {
		t.Error("Cookie should be aborted")
	}

	// Reset the cookie
	cookie.Reset()

	// Should not be aborted after reset
	if cookie.IsAborted() {
		t.Error("Cookie should not be aborted after Reset()")
	}
}
