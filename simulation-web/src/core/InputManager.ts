/**
 * Abstracts keyboard/D-pad input so simulation controls work on both
 * desktop browsers and Android TV remotes via WebView key events.
 *
 * Android TV remote keys map to standard keyboard events:
 *   D-pad Up/Down/Left/Right → ArrowUp/ArrowDown/ArrowLeft/ArrowRight
 *   Select/OK → Enter
 *   Back → Escape (or Backspace depending on WebView config)
 */

export type InputAction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'select'
  | 'back'
  | 'space';

type InputListener = (action: InputAction) => void;

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'select',
  ' ': 'space',
  Escape: 'back',
  Backspace: 'back',
};

export class InputManager {
  private _listeners: InputListener[] = [];
  private _boundHandler: (e: KeyboardEvent) => void;

  constructor() {
    this._boundHandler = this._handleKeyDown.bind(this);
  }

  attach(target: EventTarget = document): void {
    target.addEventListener('keydown', this._boundHandler as EventListener);
  }

  detach(target: EventTarget = document): void {
    target.removeEventListener('keydown', this._boundHandler as EventListener);
  }

  onInput(listener: InputListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    const action = KEY_MAP[e.key];
    if (action) {
      e.preventDefault();
      for (const listener of this._listeners) {
        listener(action);
      }
    }
  }
}
