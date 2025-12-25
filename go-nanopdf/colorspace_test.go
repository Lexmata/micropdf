package nanopdf

import (
	"testing"
)

func TestDeviceColorspaces(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	tests := []struct {
		name       string
		cs         *Colorspace
		components int
		csName     string
	}{
		{"Gray", DeviceGray(ctx), 1, "DeviceGray"},
		{"RGB", DeviceRGB(ctx), 3, "DeviceRGB"},
		{"BGR", DeviceBGR(ctx), 3, "DeviceBGR"},
		{"CMYK", DeviceCMYK(ctx), 4, "DeviceCMYK"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.cs == nil {
				t.Fatal("Colorspace is nil")
			}

			// Test component count
			if got := tt.cs.Components(); got != tt.components {
				t.Errorf("Components() = %d, want %d", got, tt.components)
			}

			// Test name
			if got := tt.cs.Name(); got != tt.csName {
				t.Errorf("Name() = %q, want %q", got, tt.csName)
			}
		})
	}
}

func TestColorspaceProperties(t *testing.T) {
	ctx := NewContext()
	if ctx == nil {
		t.Fatal("Failed to create context")
	}
	defer ctx.Drop()

	gray := DeviceGray(ctx)
	rgb := DeviceRGB(ctx)
	cmyk := DeviceCMYK(ctx)

	// Test IsGray
	if !gray.IsGray() {
		t.Error("Gray colorspace should return true for IsGray()")
	}
	if rgb.IsGray() {
		t.Error("RGB colorspace should return false for IsGray()")
	}

	// Test IsRGB
	if !rgb.IsRGB() {
		t.Error("RGB colorspace should return true for IsRGB()")
	}
	if gray.IsRGB() {
		t.Error("Gray colorspace should return false for IsRGB()")
	}

	// Test IsCMYK
	if !cmyk.IsCMYK() {
		t.Error("CMYK colorspace should return true for IsCMYK()")
	}
	if gray.IsCMYK() {
		t.Error("Gray colorspace should return false for IsCMYK()")
	}
}
