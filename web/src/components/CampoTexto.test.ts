import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'
import CampoTexto from './CampoTexto.vue'

function montar(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const Pai = defineComponent({
    components: { CampoTexto },
    setup: () => ({ valor: ref(''), props, attrs }),
    template: `<form @submit.prevent="$emit('enviou')"><CampoTexto v-model="valor" v-bind="{ ...props, ...attrs }" /></form>`,
  })
  return mount(Pai, { attachTo: document.body })
}

describe('CampoTexto', () => {
  it('rótulo ligado ao input e atributos repassados ao input', () => {
    const w = montar({ rotulo: 'E-mail' }, { name: 'email', type: 'email', required: true, autocomplete: 'email' })
    const input = w.get('input')
    expect(w.get(`label[for="${input.attributes('id')}"]`).text()).toBe('E-mail')
    expect(input.attributes()).toMatchObject({ name: 'email', type: 'email', autocomplete: 'email' })
    expect(input.attributes('required')).toBeDefined()
    w.unmount()
  })

  it('v-model nos dois sentidos', async () => {
    const w = montar({ rotulo: 'Nome' })
    await w.get('input').setValue('Ana')
    expect((w.vm as unknown as { valor: string }).valor).toBe('Ana')
    w.unmount()
  })

  it('dica é ligada por aria-describedby', () => {
    const w = montar({ rotulo: 'Nick', dica: 'Aparece como @nick.' })
    const id = w.get('input').attributes('aria-describedby')!
    expect(document.getElementById(id)!.textContent).toBe('Aparece como @nick.')
    w.unmount()
  })

  it('senha: botão mostra/oculta, com aria-pressed, sem enviar o formulário', async () => {
    const w = montar({ rotulo: 'Senha', senha: true }, { name: 'senha' })
    const input = () => w.get('input[name=senha]')
    const botao = () => w.get('button')
    expect(input().attributes('type')).toBe('password')
    expect(botao().attributes('type')).toBe('button')
    expect(botao().attributes('aria-label')).toBe('Mostrar senha')
    expect(botao().attributes('aria-pressed')).toBe('false')

    await botao().trigger('click')
    expect(input().attributes('type')).toBe('text')
    expect(botao().attributes('aria-pressed')).toBe('true')
    expect(w.emitted('enviou')).toBeUndefined()

    await botao().trigger('click')
    expect(input().attributes('type')).toBe('password')
    w.unmount()
  })

  it('campo comum não tem botão de senha', () => {
    const w = montar({ rotulo: 'Nome' })
    expect(w.find('button').exists()).toBe(false)
    w.unmount()
  })
})
