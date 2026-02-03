import { r as reactExports, j as jsxRuntimeExports } from "../_chunks/_libs/react.mjs";
import { a as api, C as Card, b as CardHeader, c as CardTitle, d as CardDescription, e as CardAction, f as CardContent } from "./card-DVx9SFsi.mjs";
import { B as Button, e as cn, a as useIsoLayoutEffect, b as useStableCallback, c as useRenderElement, d as createChangeEventDetails, n as none, N as NOOP, f as formatErrorMessage, u as useBaseUiId, i as isElement, E as EMPTY_OBJECT } from "./router-DJkLI7Pk.mjs";
import { f as formatCost } from "./utils-B-v2tgNy.mjs";
import { r as reactDomExports } from "../_chunks/_libs/react-dom.mjs";
import { u as useQuery, b as useMutation } from "../_libs/convex.mjs";
import { d as Plus, D as DollarSign, T as Trash2, B as Bell } from "../_libs/lucide-react.mjs";
import "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_chunks/_libs/@tanstack/query-core.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
let FieldControlDataAttributes = /* @__PURE__ */ (function(FieldControlDataAttributes2) {
  FieldControlDataAttributes2["disabled"] = "data-disabled";
  FieldControlDataAttributes2["valid"] = "data-valid";
  FieldControlDataAttributes2["invalid"] = "data-invalid";
  FieldControlDataAttributes2["touched"] = "data-touched";
  FieldControlDataAttributes2["dirty"] = "data-dirty";
  FieldControlDataAttributes2["filled"] = "data-filled";
  FieldControlDataAttributes2["focused"] = "data-focused";
  return FieldControlDataAttributes2;
})({});
const DEFAULT_VALIDITY_STATE = {
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: null,
  valueMissing: false
};
const fieldValidityMapping = {
  valid(value) {
    if (value === null) {
      return null;
    }
    if (value) {
      return {
        [FieldControlDataAttributes.valid]: ""
      };
    }
    return {
      [FieldControlDataAttributes.invalid]: ""
    };
  }
};
const FieldRootContext = /* @__PURE__ */ reactExports.createContext({
  invalid: void 0,
  name: void 0,
  validityData: {
    state: DEFAULT_VALIDITY_STATE,
    errors: [],
    error: "",
    value: "",
    initialValue: null
  },
  setValidityData: NOOP,
  disabled: void 0,
  touched: false,
  setTouched: NOOP,
  dirty: false,
  setDirty: NOOP,
  filled: false,
  setFilled: NOOP,
  focused: false,
  setFocused: NOOP,
  validate: () => null,
  validationMode: "onSubmit",
  validationDebounceTime: 0,
  shouldValidateOnChange: () => false,
  state: {
    disabled: false,
    valid: null,
    touched: false,
    dirty: false,
    filled: false,
    focused: false
  },
  markedDirtyRef: {
    current: false
  },
  validation: {
    getValidationProps: (props = EMPTY_OBJECT) => props,
    getInputValidationProps: (props = EMPTY_OBJECT) => props,
    inputRef: {
      current: null
    },
    commit: async () => {
    }
  }
});
function useFieldRootContext(optional = true) {
  const context = reactExports.useContext(FieldRootContext);
  if (context.setValidityData === NOOP && !optional) {
    throw new Error(formatErrorMessage(28));
  }
  return context;
}
const FormContext = /* @__PURE__ */ reactExports.createContext({
  formRef: {
    current: {
      fields: /* @__PURE__ */ new Map()
    }
  },
  errors: {},
  clearErrors: NOOP,
  validationMode: "onSubmit",
  submitAttemptedRef: {
    current: false
  }
});
function useFormContext() {
  return reactExports.useContext(FormContext);
}
const LabelableContext = /* @__PURE__ */ reactExports.createContext({
  controlId: void 0,
  setControlId: NOOP,
  labelId: void 0,
  setLabelId: NOOP,
  messageIds: [],
  setMessageIds: NOOP,
  getDescriptionProps: (externalProps) => externalProps
});
function useLabelableContext() {
  return reactExports.useContext(LabelableContext);
}
function getCombinedFieldValidityData(validityData, invalid) {
  return {
    ...validityData,
    state: {
      ...validityData.state,
      valid: !invalid && validityData.state.valid
    }
  };
}
function useControlled({
  controlled,
  default: defaultProp,
  name,
  state = "value"
}) {
  const {
    current: isControlled
  } = reactExports.useRef(controlled !== void 0);
  const [valueState, setValue] = reactExports.useState(defaultProp);
  const value = isControlled ? controlled : valueState;
  const setValueIfUncontrolled = reactExports.useCallback((newValue) => {
    if (!isControlled) {
      setValue(newValue);
    }
  }, []);
  return [value, setValueIfUncontrolled];
}
function useLabelableId(params = {}) {
  const {
    id,
    implicit = false,
    controlRef
  } = params;
  const {
    controlId,
    setControlId
  } = useLabelableContext();
  const defaultId = useBaseUiId(id);
  useIsoLayoutEffect(() => {
    if (!implicit && !id || setControlId === NOOP) {
      return void 0;
    }
    if (implicit) {
      const elem = controlRef?.current;
      if (isElement(elem) && elem.closest("label") != null) {
        setControlId(id ?? null);
      } else {
        setControlId(controlId ?? defaultId);
      }
    } else if (id) {
      setControlId(id);
    }
    return () => {
      if (id) {
        setControlId(void 0);
      }
    };
  }, [id, controlRef, controlId, setControlId, implicit, defaultId]);
  return controlId ?? defaultId;
}
function useField(params) {
  const {
    enabled = true,
    value,
    id,
    name,
    controlRef,
    commit
  } = params;
  const {
    formRef
  } = useFormContext();
  const {
    invalid,
    markedDirtyRef,
    validityData,
    setValidityData
  } = useFieldRootContext();
  const getValue = useStableCallback(params.getValue);
  useIsoLayoutEffect(() => {
    if (!enabled) {
      return;
    }
    let initialValue = value;
    if (initialValue === void 0) {
      initialValue = getValue();
    }
    if (validityData.initialValue === null && initialValue !== null) {
      setValidityData((prev) => ({
        ...prev,
        initialValue
      }));
    }
  }, [enabled, setValidityData, value, validityData.initialValue, getValue]);
  useIsoLayoutEffect(() => {
    if (!enabled || !id) {
      return;
    }
    formRef.current.fields.set(id, {
      getValue,
      name,
      controlRef,
      validityData: getCombinedFieldValidityData(validityData, invalid),
      validate(flushSync = true) {
        let nextValue = value;
        if (nextValue === void 0) {
          nextValue = getValue();
        }
        markedDirtyRef.current = true;
        if (!flushSync) {
          commit(nextValue);
        } else {
          reactDomExports.flushSync(() => commit(nextValue));
        }
      }
    });
  }, [commit, controlRef, enabled, formRef, getValue, id, invalid, markedDirtyRef, name, validityData, value]);
  useIsoLayoutEffect(() => {
    const fields = formRef.current.fields;
    return () => {
      if (id) {
        fields.delete(id);
      }
    };
  }, [formRef, id]);
}
const FieldControl = /* @__PURE__ */ reactExports.forwardRef(function FieldControl2(componentProps, forwardedRef) {
  const {
    render,
    className,
    id: idProp,
    name: nameProp,
    value: valueProp,
    disabled: disabledProp = false,
    onValueChange,
    defaultValue,
    ...elementProps
  } = componentProps;
  const {
    state: fieldState,
    name: fieldName,
    disabled: fieldDisabled
  } = useFieldRootContext();
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;
  const state = reactExports.useMemo(() => ({
    ...fieldState,
    disabled
  }), [fieldState, disabled]);
  const {
    setTouched,
    setDirty,
    validityData,
    setFocused,
    setFilled,
    validationMode,
    validation
  } = useFieldRootContext();
  const {
    labelId
  } = useLabelableContext();
  const id = useLabelableId({
    id: idProp
  });
  useIsoLayoutEffect(() => {
    const hasExternalValue = valueProp != null;
    if (validation.inputRef.current?.value || hasExternalValue && valueProp !== "") {
      setFilled(true);
    } else if (hasExternalValue && valueProp === "") {
      setFilled(false);
    }
  }, [validation.inputRef, setFilled, valueProp]);
  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: "FieldControl",
    state: "value"
  });
  const isControlled = valueProp !== void 0;
  const setValue = useStableCallback((nextValue, eventDetails) => {
    onValueChange?.(nextValue, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    setValueUnwrapped(nextValue);
  });
  useField({
    id,
    name,
    commit: validation.commit,
    value,
    getValue: () => validation.inputRef.current?.value,
    controlRef: validation.inputRef
  });
  const element = useRenderElement("input", componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      id,
      disabled,
      name,
      ref: validation.inputRef,
      "aria-labelledby": labelId,
      ...isControlled ? {
        value
      } : {
        defaultValue
      },
      onChange(event) {
        const inputValue = event.currentTarget.value;
        setValue(inputValue, createChangeEventDetails(none, event.nativeEvent));
        setDirty(inputValue !== validityData.initialValue);
        setFilled(inputValue !== "");
      },
      onFocus() {
        setFocused(true);
      },
      onBlur(event) {
        setTouched(true);
        setFocused(false);
        if (validationMode === "onBlur") {
          validation.commit(event.currentTarget.value);
        }
      },
      onKeyDown(event) {
        if (event.currentTarget.tagName === "INPUT" && event.key === "Enter") {
          setTouched(true);
          validation.commit(event.currentTarget.value);
        }
      }
    }, validation.getInputValidationProps(), elementProps],
    stateAttributesMapping: fieldValidityMapping
  });
  return element;
});
const Input$1 = /* @__PURE__ */ reactExports.forwardRef(function Input2(props, forwardedRef) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(FieldControl, {
    ref: forwardedRef,
    ...props
  });
});
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Input$1,
    {
      type,
      "data-slot": "input",
      className: cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
function SettingsPage() {
  const notificationChannels = useQuery(api.notifications.list);
  const budgets = useQuery(api.budgets.list);
  const createBudget = useMutation(api.budgets.create);
  const removeBudget = useMutation(api.budgets.remove);
  const createNotification = useMutation(api.notifications.create);
  const removeNotification = useMutation(api.notifications.remove);
  const [showNewBudget, setShowNewBudget] = reactExports.useState(false);
  const [showNewChannel, setShowNewChannel] = reactExports.useState(false);
  const [budgetName, setBudgetName] = reactExports.useState("");
  const [budgetLimit, setBudgetLimit] = reactExports.useState("10");
  const [budgetPeriod, setBudgetPeriod] = reactExports.useState("daily");
  const [budgetHardStop, setBudgetHardStop] = reactExports.useState(false);
  const [channelType, setChannelType] = reactExports.useState("discord");
  const [channelName, setChannelName] = reactExports.useState("");
  const [channelWebhook, setChannelWebhook] = reactExports.useState("");
  const [channelEmail, setChannelEmail] = reactExports.useState("");
  const handleCreateBudget = async () => {
    if (!budgetName || !budgetLimit) return;
    await createBudget({
      name: budgetName,
      limitDollars: parseFloat(budgetLimit),
      period: budgetPeriod,
      hardStop: budgetHardStop
    });
    setBudgetName("");
    setBudgetLimit("10");
    setShowNewBudget(false);
  };
  const handleCreateChannel = async () => {
    if (!channelName) return;
    await createNotification({
      type: channelType,
      name: channelName,
      config: {
        webhookUrl: channelWebhook || void 0,
        email: channelEmail || void 0
      }
    });
    setChannelName("");
    setChannelWebhook("");
    setChannelEmail("");
    setShowNewChannel(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col gap-6 p-6 max-w-4xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Budgets" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Set spending limits for your agents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowNewBudget(!showNewBudget), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Add Budget"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        showNewBudget && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 space-y-3 rounded-lg border bg-muted/30 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Budget name", value: budgetName, onChange: (e) => setBudgetName(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Limit ($)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", value: budgetLimit, onChange: (e) => setBudgetLimit(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Period" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: budgetPeriod, onChange: (e) => setBudgetPeriod(e.target.value), className: "w-full rounded-md border bg-background px-3 py-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "hourly", children: "Hourly" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "daily", children: "Daily" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "weekly", children: "Weekly" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "monthly", children: "Monthly" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: budgetHardStop, onChange: (e) => setBudgetHardStop(e.target.checked), className: "rounded border-border" }),
            "Hard stop (pause agent when exceeded)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowNewBudget(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleCreateBudget, children: "Create" })
          ] })
        ] }),
        budgets && budgets.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: budgets.map((budget) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: budget.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
                formatCost(budget.limitDollars),
                " / ",
                budget.period,
                budget.hardStop && " · Hard stop"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeBudget({
            id: budget._id
          }), className: "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, budget._id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-4 text-center text-sm text-muted-foreground", children: "No budgets configured" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Notification Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Where alerts get delivered" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardAction, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowNewChannel(!showNewChannel), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          "Add Channel"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        showNewChannel && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 space-y-3 rounded-lg border bg-muted/30 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: channelType, onChange: (e) => setChannelType(e.target.value), className: "w-full rounded-md border bg-background px-3 py-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "discord", children: "Discord Webhook" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "email", children: "Email" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "webhook", children: "Custom Webhook" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "e.g. #alerts", value: channelName, onChange: (e) => setChannelName(e.target.value) })
            ] })
          ] }),
          (channelType === "discord" || channelType === "webhook") && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "url", placeholder: "Webhook URL", value: channelWebhook, onChange: (e) => setChannelWebhook(e.target.value) }),
          channelType === "email" && /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", placeholder: "Email address", value: channelEmail, onChange: (e) => setChannelEmail(e.target.value) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowNewChannel(false), children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleCreateChannel, children: "Create" })
          ] })
        ] }),
        notificationChannels && notificationChannels.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: notificationChannels.map((channel) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium", children: channel.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: channel.type })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded-full px-2 py-0.5 text-xs", channel.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"), children: channel.isActive ? "Active" : "Disabled" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeNotification({
              id: channel._id
            }), className: "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }, channel._id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-4 text-center text-sm text-muted-foreground", children: "No notification channels configured" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Gateway Connection" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Connect to your Clawdbot gateway" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Gateway URL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "ws://127.0.0.1:18789" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1 block text-xs text-muted-foreground", children: "Gateway Token" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", placeholder: "Your gateway token" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { children: "Connect" })
      ] }) })
    ] })
  ] });
}
export {
  SettingsPage as component
};
