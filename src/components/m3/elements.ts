/**
 * Thin React wrappers around Google's official Material 3 web components
 * (`@material/web`), generated with `@lit/react`'s `createComponent` so that
 * DOM properties (not just attributes) and custom events are handled
 * correctly from React. This is the primitive layer — build higher-level
 * pieces (Card, Table, Avatar, ...) on top of these plus Tailwind, since
 * @material/web itself doesn't ship components for everything.
 */
import * as React from "react";
import { createComponent } from "@lit/react";

import { MdElevatedButton } from "@material/web/button/elevated-button.js";
import { MdFilledButton } from "@material/web/button/filled-button.js";
import { MdFilledTonalButton } from "@material/web/button/filled-tonal-button.js";
import { MdOutlinedButton } from "@material/web/button/outlined-button.js";
import { MdTextButton } from "@material/web/button/text-button.js";

import { MdFilledIconButton } from "@material/web/iconbutton/filled-icon-button.js";
import { MdFilledTonalIconButton } from "@material/web/iconbutton/filled-tonal-icon-button.js";
import { MdOutlinedIconButton } from "@material/web/iconbutton/outlined-icon-button.js";
import { MdIconButton } from "@material/web/iconbutton/icon-button.js";

import { MdFab } from "@material/web/fab/fab.js";

import { MdAssistChip } from "@material/web/chips/assist-chip.js";
import { MdFilterChip } from "@material/web/chips/filter-chip.js";
import { MdInputChip } from "@material/web/chips/input-chip.js";
import { MdSuggestionChip } from "@material/web/chips/suggestion-chip.js";
import { MdChipSet } from "@material/web/chips/chip-set.js";

import { MdList } from "@material/web/list/list.js";
import { MdListItem } from "@material/web/list/list-item.js";

import { MdMenu } from "@material/web/menu/menu.js";
import { MdMenuItem } from "@material/web/menu/menu-item.js";

import { MdLinearProgress } from "@material/web/progress/linear-progress.js";
import { MdCircularProgress } from "@material/web/progress/circular-progress.js";

import { MdDivider } from "@material/web/divider/divider.js";
import { MdIcon } from "@material/web/icon/icon.js";

import { MdOutlinedSelect } from "@material/web/select/outlined-select.js";
import { MdSelectOption } from "@material/web/select/select-option.js";

import { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

import { MdDialog } from "@material/web/dialog/dialog.js";

import { MdTabs } from "@material/web/tabs/tabs.js";
import { MdPrimaryTab } from "@material/web/tabs/primary-tab.js";
import { MdSecondaryTab } from "@material/web/tabs/secondary-tab.js";

import { MdCheckbox } from "@material/web/checkbox/checkbox.js";
import { MdRadio } from "@material/web/radio/radio.js";
import { MdSwitch } from "@material/web/switch/switch.js";

const wrap = createComponent;

export const MdElevatedButtonEl = wrap({
  react: React,
  tagName: "md-elevated-button",
  elementClass: MdElevatedButton,
});
export const MdFilledButtonEl = wrap({
  react: React,
  tagName: "md-filled-button",
  elementClass: MdFilledButton,
});
export const MdFilledTonalButtonEl = wrap({
  react: React,
  tagName: "md-filled-tonal-button",
  elementClass: MdFilledTonalButton,
});
export const MdOutlinedButtonEl = wrap({
  react: React,
  tagName: "md-outlined-button",
  elementClass: MdOutlinedButton,
});
export const MdTextButtonEl = wrap({
  react: React,
  tagName: "md-text-button",
  elementClass: MdTextButton,
});

export const MdFilledIconButtonEl = wrap({
  react: React,
  tagName: "md-filled-icon-button",
  elementClass: MdFilledIconButton,
});
export const MdFilledTonalIconButtonEl = wrap({
  react: React,
  tagName: "md-filled-tonal-icon-button",
  elementClass: MdFilledTonalIconButton,
});
export const MdOutlinedIconButtonEl = wrap({
  react: React,
  tagName: "md-outlined-icon-button",
  elementClass: MdOutlinedIconButton,
});
export const MdIconButtonEl = wrap({
  react: React,
  tagName: "md-icon-button",
  elementClass: MdIconButton,
});

export const MdFabEl = wrap({ react: React, tagName: "md-fab", elementClass: MdFab });

export const MdAssistChipEl = wrap({
  react: React,
  tagName: "md-assist-chip",
  elementClass: MdAssistChip,
});
export const MdFilterChipEl = wrap({
  react: React,
  tagName: "md-filter-chip",
  elementClass: MdFilterChip,
  events: { onChipClick: "click" as const },
});
export const MdInputChipEl = wrap({
  react: React,
  tagName: "md-input-chip",
  elementClass: MdInputChip,
  events: { onRemove: "remove" as const },
});
export const MdSuggestionChipEl = wrap({
  react: React,
  tagName: "md-suggestion-chip",
  elementClass: MdSuggestionChip,
});
export const MdChipSetEl = wrap({ react: React, tagName: "md-chip-set", elementClass: MdChipSet });

export const MdListEl = wrap({ react: React, tagName: "md-list", elementClass: MdList });
export const MdListItemEl = wrap({
  react: React,
  tagName: "md-list-item",
  elementClass: MdListItem,
});

export const MdMenuEl = wrap({
  react: React,
  tagName: "md-menu",
  elementClass: MdMenu,
  events: { onOpened: "opened" as const, onClosed: "closed" as const },
});
export const MdMenuItemEl = wrap({
  react: React,
  tagName: "md-menu-item",
  elementClass: MdMenuItem,
});

export const MdLinearProgressEl = wrap({
  react: React,
  tagName: "md-linear-progress",
  elementClass: MdLinearProgress,
});
export const MdCircularProgressEl = wrap({
  react: React,
  tagName: "md-circular-progress",
  elementClass: MdCircularProgress,
});

export const MdDividerEl = wrap({ react: React, tagName: "md-divider", elementClass: MdDivider });
export const MdIconEl = wrap({ react: React, tagName: "md-icon", elementClass: MdIcon });

export const MdOutlinedSelectEl = wrap({
  react: React,
  tagName: "md-outlined-select",
  elementClass: MdOutlinedSelect,
  events: { onChange: "change" as const },
});
export const MdSelectOptionEl = wrap({
  react: React,
  tagName: "md-select-option",
  elementClass: MdSelectOption,
});

export const MdOutlinedTextFieldEl = wrap({
  react: React,
  tagName: "md-outlined-text-field",
  elementClass: MdOutlinedTextField,
  events: { onInput: "input" as const, onChange: "change" as const },
});

export const MdDialogEl = wrap({
  react: React,
  tagName: "md-dialog",
  elementClass: MdDialog,
  events: { onClose: "close" as const, onCancel: "cancel" as const },
});

export const MdTabsEl = wrap({
  react: React,
  tagName: "md-tabs",
  elementClass: MdTabs,
  events: { onChange: "change" as const },
});
export const MdPrimaryTabEl = wrap({
  react: React,
  tagName: "md-primary-tab",
  elementClass: MdPrimaryTab,
});
export const MdSecondaryTabEl = wrap({
  react: React,
  tagName: "md-secondary-tab",
  elementClass: MdSecondaryTab,
});

export const MdCheckboxEl = wrap({
  react: React,
  tagName: "md-checkbox",
  elementClass: MdCheckbox,
  events: { onChange: "change" as const },
});
export const MdRadioEl = wrap({
  react: React,
  tagName: "md-radio",
  elementClass: MdRadio,
  events: { onChange: "change" as const },
});
export const MdSwitchEl = wrap({
  react: React,
  tagName: "md-switch",
  elementClass: MdSwitch,
  events: { onChange: "change" as const },
});
