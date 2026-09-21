export function sanitizeCourseContent(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove LaTeX inline math delimiters like \( ... \) or \[ ... \]
  cleaned = cleaned.replace(/\\\((.*?)\\\)/g, '$1');
  cleaned = cleaned.replace(/\\\[(.*?)\\\]/g, '$1');

  // Clean unescaped dollar signs wrapped around single words/variables (e.g. $variable$ -> variable)
  cleaned = cleaned.replace(/\$([a-zA-Z0-9_\-\s]{1,30})\$/g, '$1');

  // Fix escaped markdown characters
  cleaned = cleaned.replace(/\\([#*_`~\\()\[\]])/g, '$1');

  // Remove control characters except newline and tab
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  return cleaned.trim();
}

export function sanitizeCourseJson(courseObj: any): any {
  if (!courseObj) return courseObj;

  if (typeof courseObj.courseTitle === 'string') {
    courseObj.courseTitle = sanitizeCourseContent(courseObj.courseTitle);
  }

  if (Array.isArray(courseObj.modules)) {
    courseObj.modules = courseObj.modules.map((mod: any) => {
      if (typeof mod.title === 'string') mod.title = sanitizeCourseContent(mod.title);
      if (typeof mod.subtitle === 'string') mod.subtitle = sanitizeCourseContent(mod.subtitle);
      if (typeof mod.content === 'string') mod.content = sanitizeCourseContent(mod.content);

      if (mod.quiz && typeof mod.quiz.question === 'string') {
        mod.quiz.question = sanitizeCourseContent(mod.quiz.question);
        if (Array.isArray(mod.quiz.options)) {
          mod.quiz.options = mod.quiz.options.map((opt: string) => (typeof opt === 'string' ? sanitizeCourseContent(opt) : opt));
        }
      }

      if (Array.isArray(mod.questions)) {
        mod.questions = mod.questions.map((q: any) => {
          if (typeof q.question === 'string') q.question = sanitizeCourseContent(q.question);
          if (Array.isArray(q.options)) {
            q.options = q.options.map((opt: string) => (typeof opt === 'string' ? sanitizeCourseContent(opt) : opt));
          }
          return q;
        });
      }

      return mod;
    });
  }

  return courseObj;
}
