package micropdf

import (
	"testing"
)

func TestVersion(t *testing.T) {
	version := Version()
	if version == "" {
		t.Error("Version() should return non-empty string")
	}

	t.Logf("MicroPDF version: %s", version)

	// Version should be in format X.Y.Z or X.Y.Z-suffix
	if len(version) < 5 {
		t.Errorf("Version format unexpected: %s", version)
	}
}

func TestIsMock(t *testing.T) {
	isMock := IsMock()

	t.Logf("Running in mock mode: %v", isMock)

	// IsMock should return a boolean (just verify it runs)
	if isMock {
		t.Log("Using mock implementation")
	} else {
		t.Log("Using native CGO implementation")
	}
}
