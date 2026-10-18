const stack = [];
let bound = false;

function onKey(e) {
  if (e.key !== 'Escape') return;
  const top = stack[stack.length - 1];
  if (top) {
    e.stopPropagation();
    e.preventDefault();
    top();
  }
}

function bind() {
  if (bound) return;
  document.addEventListener('keydown', onKey, true);
  bound = true;
}

function unbind() {
  if (stack.length > 0) return;
  document.removeEventListener('keydown', onKey, true);
  bound = false;
}

export function pushOverlay(closeFn) {
  stack.push(closeFn);
  bind();
  document.body.style.overflow = 'hidden';
}

export function popOverlay(closeFn) {
  const i = stack.lastIndexOf(closeFn);
  if (i !== -1) stack.splice(i, 1);
  if (stack.length === 0) document.body.style.overflow = '';
  unbind();
}
