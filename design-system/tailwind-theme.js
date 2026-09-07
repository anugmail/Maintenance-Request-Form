/* ============================================================
   สร้างโดย design-system/build-tailwind-theme.js — ห้ามแก้ไฟล์นี้มือ
   theme ของ Tailwind (Play CDN) map จาก tokens.css — ค่าชี้ CSS var
   จึงแก้สีที่ tokens.css ที่เดียวเหมือนเดิม · preflight ปิดไว้กันรีเซ็ต
   ทับ components.css (คลาส component กลางใช้ต่อตามเดิมแบบ DaisyUI)
   ============================================================ */
window.tailwind = window.tailwind || {};
tailwind.config = {
  corePlugins: { preflight: false },
  theme: {
  "colors": {
    "brand-800": "var(--brand-800)",
    "brand-700": "var(--brand-700)",
    "brand-600": "var(--brand-600)",
    "brand-500": "var(--brand-500)",
    "brand-200": "var(--brand-200)",
    "brand-100": "var(--brand-100)",
    "brand-50": "var(--brand-50)",
    "brand-25": "var(--brand-25)",
    "brand-accent": "var(--brand-accent)",
    "gray-950": "var(--gray-950)",
    "gray-900": "var(--gray-900)",
    "gray-800": "var(--gray-800)",
    "gray-700": "var(--gray-700)",
    "gray-600": "var(--gray-600)",
    "gray-500": "var(--gray-500)",
    "gray-400": "var(--gray-400)",
    "gray-300": "var(--gray-300)",
    "gray-200": "var(--gray-200)",
    "gray-100": "var(--gray-100)",
    "gray-50": "var(--gray-50)",
    "gray-25": "var(--gray-25)",
    "success-700": "var(--success-700)",
    "success-600": "var(--success-600)",
    "success-500": "var(--success-500)",
    "success-200": "var(--success-200)",
    "success-100": "var(--success-100)",
    "success-50": "var(--success-50)",
    "success-25": "var(--success-25)",
    "warning-800": "var(--warning-800)",
    "warning-700": "var(--warning-700)",
    "warning-600": "var(--warning-600)",
    "warning-200": "var(--warning-200)",
    "warning-50": "var(--warning-50)",
    "error-700": "var(--error-700)",
    "error-600": "var(--error-600)",
    "error-500": "var(--error-500)",
    "error-300": "var(--error-300)",
    "error-200": "var(--error-200)",
    "error-50": "var(--error-50)",
    "info-700": "var(--info-700)",
    "info-600": "var(--info-600)",
    "info-200": "var(--info-200)",
    "info-100": "var(--info-100)",
    "info-50": "var(--info-50)",
    "info-25": "var(--info-25)",
    "badge-brand-bg": "var(--badge-brand-bg)",
    "badge-brand-border": "var(--badge-brand-border)",
    "badge-neutral-text": "var(--badge-neutral-text)",
    "badge-neutral-bg": "var(--badge-neutral-bg)",
    "badge-neutral-border": "var(--badge-neutral-border)",
    "secondary-700": "var(--secondary-700)",
    "secondary-600": "var(--secondary-600)",
    "secondary-50": "var(--secondary-50)",
    "chart-1": "var(--chart-1)",
    "chart-2": "var(--chart-2)",
    "chart-3": "var(--chart-3)",
    "chart-4": "var(--chart-4)",
    "chart-5": "var(--chart-5)",
    "chart-6": "var(--chart-6)",
    "color-bg-primary": "var(--color-bg-primary)",
    "color-bg-primary-hover": "var(--color-bg-primary-hover)",
    "color-bg-disabled": "var(--color-bg-disabled)",
    "color-border-primary": "var(--color-border-primary)",
    "color-border-disabled-subtle": "var(--color-border-disabled-subtle)",
    "color-text-primary": "var(--color-text-primary)",
    "color-text-secondary": "var(--color-text-secondary)",
    "color-text-secondary-hover": "var(--color-text-secondary-hover)",
    "color-text-tertiary": "var(--color-text-tertiary)",
    "color-text-tertiary-hover": "var(--color-text-tertiary-hover)",
    "color-fg-disabled": "var(--color-fg-disabled)",
    "btn-primary-bg": "var(--btn-primary-bg)",
    "btn-primary-bg-hover": "var(--btn-primary-bg-hover)",
    "btn-primary-border": "var(--btn-primary-border)",
    "btn-primary-border-hover": "var(--btn-primary-border-hover)",
    "btn-primary-text": "var(--btn-primary-text)",
    "btn-secondary-text": "var(--btn-secondary-text)",
    "btn-secondary-border": "var(--btn-secondary-border)",
    "btn-tertiary-text": "var(--btn-tertiary-text)",
    "btn-tertiary-brand-text": "var(--btn-tertiary-brand-text)",
    "btn-tertiary-danger-text": "var(--btn-tertiary-danger-text)",
    "btn-disabled-bg": "var(--btn-disabled-bg)",
    "btn-disabled-text": "var(--btn-disabled-text)",
    "btn-destructive-bg": "var(--btn-destructive-bg)",
    "btn-destructive-bg-hover": "var(--btn-destructive-bg-hover)",
    "btn-destructive-text": "var(--btn-destructive-text)",
    "btn-link-text": "var(--btn-link-text)",
    "btn-link-text-hover": "var(--btn-link-text-hover)",
    "focus-ring": "var(--focus-ring)",
    "focus-ring-error": "var(--focus-ring-error)",
    "primary-800": "var(--primary-800)",
    "primary-700": "var(--primary-700)",
    "primary-600": "var(--primary-600)",
    "primary-500": "var(--primary-500)",
    "primary-50": "var(--primary-50)",
    "primary-25": "var(--primary-25)",
    "white": "#fff",
    "black": "#000",
    "transparent": "transparent",
    "current": "currentColor"
  },
  "borderRadius": {
    "xs": "var(--rounded-xs)",
    "sm": "var(--rounded-sm)",
    "md": "var(--rounded-md)",
    "lg": "var(--rounded-lg)",
    "rsm": "var(--r-sm)",
    "rmd": "var(--r-md)",
    "rlg": "var(--r-lg)",
    "pill": "var(--r-pill)",
    "full": "9999px",
    "DEFAULT": "var(--rounded-md)"
  },
  "fontFamily": {
    "sans": [
      "'IBM Plex Sans Thai'",
      "sans-serif"
    ]
  },
  "fontSize": {
    "xs": [
      "var(--fs-text-xs)",
      "var(--lh-text-xs)"
    ],
    "sm": [
      "var(--fs-text-sm)",
      "var(--lh-text-sm)"
    ],
    "md": [
      "var(--fs-text-md)",
      "var(--lh-text-md)"
    ],
    "h1": [
      "var(--fs-h1)",
      "30px"
    ]
  },
  "extend": {
    "spacing": {
      "tk-0.5": "var(--space-0_5)",
      "tk-1": "var(--space-1)",
      "tk-1.5": "var(--space-1_5)",
      "tk-2": "var(--space-2)",
      "tk-2.5": "var(--space-2_5)",
      "tk-3": "var(--space-3)",
      "tk-3.5": "var(--space-3_5)",
      "tk-4": "var(--space-4)",
      "tk-4.5": "var(--space-4_5)",
      "tk-5": "var(--space-5)",
      "tk-6": "var(--space-6)"
    }
  }
}
};
