import {
  IPropsState
} from '../'

import {
  IStylesTransformer,
  BaseStylesTransformer
} from '../transformers'

import {
  IStyleResultHandler,
  StyleResultHandler
} from './handler'

import {
  IStylesComputer
} from './base'

import {
  isFun
} from '../utils'

export interface IStylesResults {
  styles: any
  transformed: any
}

export interface IStylesComputerOpts {
  transformer?: IStylesTransformer
  handler?: IStyleResultHandler
  propsOnly?: boolean
}


export class StylesComputer implements IStylesComputer {
  results: IStylesResults
  transformer: IStylesTransformer
  handler: IStyleResultHandler
  propsOnly: boolean

  protected options: any
  protected opts: IPropsState

  constructor(public styler: any, options?: IStylesComputerOpts) {
    options = options || {}
    this.options = options
    this.propsOnly = !!options.propsOnly
    this.transformer = options.transformer || this.defaultTransformer
    this.transformer.configure(options)
    this.handler = options.handler || this.defaultHandler
  }

  get defaultTransformer() {
    return new BaseStylesTransformer()
  }

  get defaultHandler() {
    return new StyleResultHandler()
  }

  /**
   * Returns a style object such as:
   * {
   *   heading: {
   *     color: 'black'
   *     // // more ...
   *   },
   *   title: {
   *     color: blue,
   *     // more ...
   *   }
   * }
   * @param opts
   */
  compute(opts: IPropsState = {}): any {
    this.opts = opts
    this.prepareStyler()
    const transformed = this.transform(this.styleResult())
    this.handler.onTransformedStyleResults(transformed)
    this.results.transformed = transformed
    return transformed
  }

  protected prepareStyler() {
    if (this.styler.configure) {
      this.styler.configure(this.opts)
    }
  }

  protected get uniqueStyleClasses(): string[] {
    return Array.from(new Set(this.styler.styleClasses))
  }

  protected get stylerKeys(): string[] {
    return Object.keys(this.styler)
  }

  protected get styleClasses(): string[] {
    return this.styler.styleClasses ? this.uniqueStyleClasses : this.stylerKeys
  }

  styleResult() {
    const styles = this.styleClasses.reduce(this.styleGenerator, {})
    this.handler.onStyleResults(styles)
    this.results.styles = styles
    return styles
  }

  // do any final transformation if transformer is set
  transform(result: any) {
    return this.transformer ? this.transformer.transform(result) : result
  }

  callStylerFunction(styleFun: Function, opts: any) {
    if (!isFun(styleFun)) return null
    return this.propsOnly ? styleFun(opts.props) : styleFun(opts)
  }

  /**
   *
   * @param result
   * @param key
   */
  styleGenerator(result: any, key: string): any {
    const styleFun: Function = this.styler[key]
    let styleResult = this.callStylerFunction(styleFun, this.opts)
    if (styleResult) {
      result[key] = styleResult
    }
    this.handler.onStyleResult(result)
    return result
  }
}
