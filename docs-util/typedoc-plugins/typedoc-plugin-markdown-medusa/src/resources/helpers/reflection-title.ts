import * as Handlebars from 'handlebars';
import { PageEvent, ParameterReflection, ReflectionKind } from 'typedoc';
import { MarkdownTheme } from '../../theme';
import { escapeChars, getDisplayName } from '../../utils';

export default function (theme: MarkdownTheme) {
  Handlebars.registerHelper(
    'reflectionTitle',
    function (this: PageEvent<any>, shouldEscape = true) {
      const { reflectionTitle } = theme.getFormattingOptionsForLocation()

      const title: string[] = [''];
      if (reflectionTitle?.kind && this.model?.kind && this.url !== this.project.url) {
        title.push(`${ReflectionKind.singularString(this.model.kind)}: `);
      }
      if (this.url === this.project.url) {
        title.push(theme.indexTitle || getDisplayName(this.model));
      } else {
        title.push(
          shouldEscape ? escapeChars(this.model.name) : this.model.name,
        );
        if (reflectionTitle?.typeParameters && this.model.typeParameters) {
          const typeParameters = this.model.typeParameters
            .map((typeParameter: ParameterReflection) => typeParameter.name)
            .join(', ');
          title.push(`<${typeParameters}${shouldEscape ? '\\>' : '>'}`);
        }
      }
      return title.join('');
    },
  );
}
