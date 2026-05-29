import nunjucks from "nunjucks";

/**
 * Products are object-type templates: applying a product's Nunjucks template to
 * an object's data produces a generated text artifact (e.g. an Oracle table's
 * DDL).
 *
 * Rendering runs in the main process because Nunjucks compiles templates with
 * `eval`/`new Function`, which the renderer's Content-Security-Policy
 * (`script-src 'self'`) forbids. Node has no such restriction.
 *
 * We render to plain text (SQL, etc.) rather than HTML, so HTML auto-escaping is
 * disabled. `throwOnUndefined` is left off so a template referencing a field the
 * object hasn't filled in yields an empty string instead of failing the render.
 */
const env = new nunjucks.Environment(undefined, {
  autoescape: false,
  throwOnUndefined: false,
  trimBlocks: true,
  lstripBlocks: true,
});

export type RenderProductProps = {
  template: string;
  context: object;
};

export type RenderProductResult =
  | { text: string; error?: undefined }
  | { text?: undefined; error: string };

/**
 * Renders a product template against an object's data.
 *
 * @param props.template - The Nunjucks template source.
 * @param props.context - The object's data (parsed YAML / live form data).
 * @returns The rendered text, or an error message on a template/render failure.
 */
export function renderProduct({
  template,
  context,
}: RenderProductProps): RenderProductResult {
  try {
    return { text: env.renderString(template, context ?? {}) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
