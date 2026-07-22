import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Sello, { SELLO_CONFIG, SELLO_SIZES } from './Sello'

describe('Sello', () => {
  describe('status rendering', () => {
    const estados = Object.keys(SELLO_CONFIG)

    estados.forEach((estado) => {
      it(`renders correct color and rotation for "${estado}"`, () => {
        const { container } = render(<Sello estado={estado} />)
        const svg = container.querySelector('svg')
        const path = container.querySelector('path')

        expect(svg).toBeInTheDocument()
        expect(path).toHaveAttribute('stroke', SELLO_CONFIG[estado].color)
        expect(path).toHaveAttribute('fill', 'none')
        expect(svg.style.transform).toBe(`rotate(${SELLO_CONFIG[estado].rotation}deg)`)
      })
    })

    it('renders fallback for unknown estado', () => {
      const { container } = render(<Sello estado="desconocido" />)
      const path = container.querySelector('path')
      const svg = container.querySelector('svg')

      expect(path).toHaveAttribute('stroke', '#8A87A3')
      expect(svg.style.transform).toBe('rotate(0deg)')
    })
  })

  describe('size prop', () => {
    it('renders sm at 80px', () => {
      const { container } = render(<Sello estado="ingresado" size="sm" />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('width', '80')
      expect(svg).toHaveAttribute('height', '80')
    })

    it('renders md at 128px (default)', () => {
      const { container } = render(<Sello estado="ingresado" />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('width', '128')
      expect(svg).toHaveAttribute('height', '128')
    })

    it('renders lg at 180px', () => {
      const { container } = render(<Sello estado="ingresado" size="lg" />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('width', '180')
      expect(svg).toHaveAttribute('height', '180')
    })

    it('defaults to md for unknown size', () => {
      const { container } = render(<Sello estado="ingresado" size="xl" />)
      const svg = container.querySelector('svg')

      expect(svg).toHaveAttribute('width', '128')
      expect(svg).toHaveAttribute('height', '128')
    })
  })

  describe('text rendering', () => {
    it('displays default text from config', () => {
      const { container } = render(<Sello estado="aprobado_guardia" />)
      const text = container.querySelector('text')

      expect(text.textContent).toBe('APROBADO')
    })

    it('uses custom texto prop over default', () => {
      const { container } = render(<Sello estado="aprobado_guardia" texto="CONFIRMADO" />)
      const text = container.querySelector('text')

      expect(text.textContent).toBe('CONFIRMADO')
    })

    it('uppercases the texto prop', () => {
      const { container } = render(<Sello estado="ingresado" texto="listo" />)
      const text = container.querySelector('text')

      expect(text.textContent).toBe('LISTO')
    })

    it('renders empty text for unknown estado without texto prop', () => {
      const { container } = render(<Sello estado="inexistente" />)
      const text = container.querySelector('text')

      expect(text.textContent).toBe('')
    })
  })

  describe('animation', () => {
    it('applies animate-pulse-seal class when animate is true', () => {
      render(<Sello estado="procesando" animate />)
      const wrapper = screen.getByTestId('sello')

      expect(wrapper.className).toContain('animate-pulse-seal')
    })

    it('does not apply animation class when animate is false', () => {
      render(<Sello estado="procesando" animate={false} />)
      const wrapper = screen.getByTestId('sello')

      expect(wrapper.className).not.toContain('animate-pulse-seal')
    })

    it('does not apply animation class by default', () => {
      render(<Sello estado="ingresado" />)
      const wrapper = screen.getByTestId('sello')

      expect(wrapper.className).not.toContain('animate-pulse-seal')
    })
  })

  describe('styling', () => {
    it('renders at 90% opacity', () => {
      render(<Sello estado="ingresado" />)
      const wrapper = screen.getByTestId('sello')

      expect(wrapper.style.opacity).toBe('0.9')
    })

    it('merges custom className', () => {
      render(<Sello estado="ingresado" className="mt-4 custom" />)
      const wrapper = screen.getByTestId('sello')

      expect(wrapper.className).toContain('mt-4')
      expect(wrapper.className).toContain('custom')
    })
  })
})
