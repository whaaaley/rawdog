#!/bin/sh
set -e

REPO="https://github.com/whaaaley/rawdog.git"
INSTALL_DIR="$HOME/.rawdog"
BIN_DIR="$HOME/.local/bin"

# check for deno
if ! command -v deno >/dev/null 2>&1; then
  printf "deno is required but not installed. install it now? [Y/n] "
  read -r answer </dev/tty

  case "$answer" in
    n|N|no|No|NO)
      echo "install deno from https://deno.com and re-run this script"
      exit 1
      ;;
    *)
      curl -fsSL https://deno.land/install.sh | sh
      ;;
  esac
fi

# check for git
if ! command -v git >/dev/null 2>&1; then
  echo "error: git is required but not installed"
  exit 1
fi

# clone or update
if [ -d "$INSTALL_DIR" ]; then
  printf "rawdog already exists at %s. update it? [Y/n] " "$INSTALL_DIR"
  read -r answer </dev/tty

  case "$answer" in
    n|N|no|No|NO)
      echo "skipped update"
      ;;
    *)
      echo "updating $INSTALL_DIR..."
      git -C "$INSTALL_DIR" pull --ff-only
      ;;
  esac
else
  printf "clone rawdog to %s? [Y/n] " "$INSTALL_DIR"
  read -r answer </dev/tty

  case "$answer" in
    n|N|no|No|NO)
      echo "aborted"
      exit 0
      ;;
    *)
      git clone "$REPO" "$INSTALL_DIR"
      ;;
  esac
fi

# prompt before adding to PATH
printf "add rd to %s? [Y/n] " "$BIN_DIR"
read -r answer </dev/tty

case "$answer" in
  n|N|no|No|NO)
    echo ""
    echo "skipped. you can run rd with:"
    echo ""
    echo "  deno run --allow-run --allow-net --allow-read --allow-write --allow-env $INSTALL_DIR/rd.ts"
    ;;
  *)
    mkdir -p "$BIN_DIR"

    # create a wrapper script so deno resolves imports correctly
    cat > "$BIN_DIR/rd" <<'WRAPPER'
#!/bin/sh
exec deno run --allow-run --allow-net --allow-read --allow-write --allow-env "$HOME/.rawdog/rd.ts" "$@"
WRAPPER

    chmod +x "$BIN_DIR/rd"

    echo ""
    echo "installed rd to $BIN_DIR/rd"

    # check if bin dir is on PATH
    case ":$PATH:" in
      *":$BIN_DIR:"*) ;;
      *)
        echo ""
        echo "warning: $BIN_DIR is not on your PATH"
        echo "add this to your shell config:"
        echo ""
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
        ;;
    esac
    ;;
esac

echo ""
echo "run: rd ask \"hello\""
