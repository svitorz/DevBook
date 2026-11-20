// jsdom não implementa <dialog>.showModal()/close(). Simulação mínima do que o
// navegador faz e os componentes usam: o atributo open e o evento "close".
// (Foco preso e fundo inerte não são simulados; isso é provado no navegador.)
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
    this.querySelector<HTMLElement>('[autofocus]')?.focus()
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
