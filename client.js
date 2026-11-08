/**
 * Client half of the study-panel bundle.
 *
 * Contributes two things that share one id (`study-panel`):
 *   - `sidebar.panellist` — the icon entry in the left sidebar.
 *   - `main` (keyed, same id) — the panel the entry opens.
 *
 * The panel edits the global constitution file owned by the Host half; reads and
 * writes go through two exact Fetch routes on this package's connection.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-study-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-constitution';
    const PANEL_ID = 'dsh-constitution';
    const AUTOSAVE_DELAY = 700;

    const DICTS = {
      zh: {
        'nav.label': '全局宪法',
        'panel.title': '全局宪法',
        'panel.subtitle': '写在这里的准则会注入每个会话的系统提示，跨会话长期生效。',
        'panel.placeholder': '例如：\n· 回答一律用中文，代码注释也用中文\n· 改动代码前必须先读相关文件\n· 不经确认不要提交或推送\n· 结论先行，再给依据',
        'panel.save': '保存',
        'panel.saving': '保存中…',
        'panel.saved': '已保存',
        'panel.dirty': '有未保存的修改',
        'panel.loading': '读取中…',
        'panel.error': '读取或保存失败',
        'panel.retry': '重试',
        'panel.countUnit': '字',
      },
      en: {
        'nav.label': 'Constitution',
        'panel.title': 'Global constitution',
        'panel.subtitle':
          'Everything here is injected into the system prompt of every session, and applies across sessions.',
        'panel.placeholder':
          'For example:\n· Always answer in Chinese, including code comments\n· Read the relevant files before changing code\n· Never commit or push without confirmation\n· Lead with the conclusion, then the evidence',
        'panel.save': 'Save',
        'panel.saving': 'Saving…',
        'panel.saved': 'Saved',
        'panel.dirty': 'Unsaved changes',
        'panel.loading': 'Loading…',
        'panel.error': 'Load or save failed',
        'panel.retry': 'Retry',
        'panel.countUnit': 'chars',
      },
    };

    function api(route, payload) {
      return fetch(`api/dsh-constitution/${route}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload || {}),
      }).then((response) => response.json());
    }

    /** Compact home-relative path for the footer. */
    function prettyPath(path) {
      if (typeof path !== 'string' || path.length === 0) return '';
      return path.replace(/^(\/Users|\/home)\/[^/]+/, '~');
    }

    /** Original note-page mark; inherits the sidebar's active/idle color. */
    function StudyIcon(props) {
      const size = typeof props.size === 'number' ? props.size : 20;
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
          style: { display: 'block' },
        },
        h('path', { d: 'M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5z' }),
        h('path', { d: 'M14 3.5V7.5h4' }),
        h('path', { d: 'M9 12.5h6M9 16h4' }),
      );
    }

    const styles = {
      page: {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        padding: '28px clamp(16px, 2.5vw, 32px) 32px',
        paddingTop: 'calc(28px + var(--dsh-frame-top-clearance, 0px))',
        background: 'var(--dsw-alias-bg-base)',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
        fontSize: 13,
      },
      head: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        // Stay clear of the floating buddy overlay in the panel's top-right corner.
        paddingRight: 96,
      },
      title: { margin: 0, fontSize: 20, fontWeight: 500, lineHeight: '28px' },
      subtitle: {
        margin: 0,
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 12,
        lineHeight: 1.5,
      },
      path: {
        marginLeft: 6,
        padding: '0 5px',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 4,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        whiteSpace: 'nowrap',
      },
      editor: {
        boxSizing: 'border-box',
        flex: '1 1 auto',
        minHeight: 160,
        width: '100%',
        resize: 'none',
        padding: '14px 16px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 10,
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        fontSize: 13.5,
        lineHeight: 1.7,
        outline: 'none',
      },
      foot: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--dsw-alias-label-secondary)',
        fontSize: 11,
        lineHeight: 1.5,
      },
      footerLeft: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 },
      dot: { width: 6, height: 6, flex: 'none', borderRadius: '50%' },
      count: { marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' },
      retry: {
        boxSizing: 'border-box',
        flex: 'none',
        marginLeft: 'auto',
        padding: '2px 10px',
        border: '1px solid var(--dsw-alias-border-l2)',
        borderRadius: 999,
        background: 'var(--dsw-alias-bg-layer-2)',
        color: 'var(--dsw-alias-label-secondary)',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        cursor: 'pointer',
      },
      save: {
        boxSizing: 'border-box',
        flex: 'none',
        padding: '2px 12px',
        border: '1px solid transparent',
        borderRadius: 999,
        background: 'var(--dsw-alias-brand-primary)',
        color: '#fff',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '18px',
        cursor: 'pointer',
      },
      saveDisabled: {
        background: 'var(--dsw-alias-bg-layer-2)',
        borderColor: 'var(--dsw-alias-border-l2)',
        color: 'var(--dsw-alias-label-secondary)',
        opacity: 0.7,
        cursor: 'default',
      },
    };

    function dotColor(status) {
      if (status === 'error') return 'var(--dsw-alias-state-error-primary)';
      if (status === 'saved') return 'var(--dsw-alias-state-success-primary)';
      return 'var(--dsw-alias-state-warn-primary)';
    }

    function Panel(props) {
      const { t, locale } = props;
      const [, refresh] = React.useReducer((value) => value + 1, 0);
      const [text, setText] = React.useState('');
      const [savedText, setSavedText] = React.useState('');
      const [file, setFile] = React.useState('');
      const [status, setStatus] = React.useState('loading');

      // Re-render labels when the user switches locale while the panel is open.
      React.useEffect(() => {
        if (locale === undefined) return undefined;
        return locale.subscribe(() => refresh());
      }, [locale]);

      const accept = React.useCallback((snapshot, nextStatus) => {
        setFile(snapshot.path || '');
        setSavedText(snapshot.text || '');
        setStatus(nextStatus);
      }, []);

      const load = React.useCallback(() => {
        setStatus('loading');
        api('state')
          .then((result) => {
            if (result && result.ok) {
              setText(result.value.text || '');
              accept(result.value, 'saved');
            } else {
              setStatus('error');
            }
          })
          .catch(() => setStatus('error'));
      }, [accept]);

      // Load the file once when the panel mounts.
      React.useEffect(() => load(), [load]);

      const save = React.useCallback(
        (value) => {
          setStatus('saving');
          api('save', { text: value })
            .then((result) => {
              if (result && result.ok) accept(result.value, 'saved');
              else setStatus('error');
            })
            .catch(() => setStatus('error'));
        },
        [accept],
      );

      // Debounced autosave: only while the draft differs from the saved file.
      React.useEffect(() => {
        if (status === 'loading' || text === savedText) return undefined;
        const timer = setTimeout(() => save(text), AUTOSAVE_DELAY);
        return () => clearTimeout(timer);
      }, [text, savedText, status, save]);

      const dirty = text !== savedText;
      const label =
        status === 'loading'
          ? t('panel.loading')
          : status === 'saving'
            ? t('panel.saving')
            : status === 'error'
              ? t('panel.error')
              : dirty
                ? t('panel.dirty')
                : t('panel.saved');
      const visualStatus = status === 'error' ? 'error' : dirty || status === 'saving' ? 'dirty' : 'saved';
      const canSave = status !== 'loading' && status !== 'saving' && dirty;

      return h(
        'div',
        { style: styles.page },
        h(
          'div',
          { style: styles.head },
          h('h1', { style: styles.title }, t('panel.title')),
          h(
            'p',
            { style: styles.subtitle },
            t('panel.subtitle'),
            file ? h('code', { style: styles.path }, prettyPath(file)) : null,
          ),
        ),
        h('textarea', {
          style: styles.editor,
          value: text,
          placeholder: t('panel.placeholder'),
          spellCheck: false,
          'aria-label': t('panel.title'),
          onChange: (event) => setText(event.target.value),
        }),
        h(
          'div',
          { style: styles.foot },
          h(
            'span',
            { style: styles.footerLeft },
            h('span', { style: { ...styles.dot, background: dotColor(visualStatus) }, 'aria-hidden': true }),
            h('span', null, label),
          ),
          status === 'error'
            ? h(
                'button',
                { type: 'button', style: styles.retry, onClick: () => load() },
                t('panel.retry'),
              )
            : null,
          h('span', { style: styles.count }, `${text.length} ${t('panel.countUnit')}`),
          h(
            'button',
            {
              type: 'button',
              style: canSave ? styles.save : { ...styles.save, ...styles.saveDisabled },
              disabled: !canSave,
              onClick: () => save(text),
            },
            t('panel.save'),
          ),
        ),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS), 'study-panel: dictionaries');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID }, (props) =>
            h(Panel, { t, locale: ctx.locale, ...props }),
          ),
        );

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            { name: 'sidebar.panellist', id: PANEL_ID, order: 30, label: () => t('nav.label') },
            (props) => h(StudyIcon, { size: props.size }),
          ),
        );
      },
    };
  },
});
