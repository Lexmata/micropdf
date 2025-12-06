# VSCode Configuration for go-nanopdf

This directory contains VSCode-specific settings for the go-nanopdf project.

## Build Tags

The project uses build tags to conditionally compile different implementations:

- **`mock`**: Uses the pure Go mock implementation (no CGO required)
- **`cgo`**: Uses the actual Rust FFI via CGO (requires libnanopdf.a)

### Default Configuration

By default, VSCode is configured to use the `mock` build tag for better IDE experience:

```json
{
  "go.buildTags": "mock",
  "gopls": {
    "buildFlags": ["-tags=mock"],
    "env": {
      "CGO_ENABLED": "0"
    }
  }
}
```

This ensures that:
- The `native_mock.go` file is recognized by gopls
- IntelliSense and go-to-definition work correctly
- You can develop without requiring the Rust library

### Switching to CGO Mode

To develop with the real FFI implementation, modify `.vscode/settings.json`:

```json
{
  "gopls": {
    "buildFlags": [],
    "env": {
      "CGO_ENABLED": "1"
    }
  }
}
```

Then ensure you have the Rust library built:

```bash
cd ../nanopdf-rs
make
```

### Affected Files

Files with build tags:

- `native_mock.go` - Compiled with `!cgo || mock` tags
- `native_cgo.go` - Compiled with `cgo && !mock` tags

When developing, gopls will only parse files matching the active build tags.

