import { ChangeEvent } from "react";
import { AssignAction, EventObject, StateNodeConfig, assign } from "xstate";
import { Model } from "xstate/lib/model.types";
import {
  BooleanMap,
  FormContext,
  FormModel,
  FormModelActions,
  FormModelEvents,
  FormModelParams,
  FormModelSelectors,
  InitialState,
  RegisterOutput,
} from "./types";

const toInitialBooleanMap = <Values extends {}>(
  values: Values,
): BooleanMap<Values> => {
  const map = {} as BooleanMap<Values>;
  Object.keys(values).forEach((key) => {
    (map as any)[key] = false;
  });
  return map;
};

export const makeInitialStateFromConfig = <Values extends {}>(
  config: FormModelParams<Values>,
): InitialState<Values> => {
  return {
    values: config.initialValues,
    errors: config.validate?.(config.initialValues) || {},
    touched: toInitialBooleanMap(config.initialValues),
    submitCount: 0,
  };
};

export const createFormModel = <Key extends string, Values extends {}>(
  key: Key,
  config: FormModelParams<Values>,
): FormModel<Key, Values> => {
  const events: FormModelEvents<Key, Values> = {
    change: (name, value) => {
      return {
        type: `${key}.CHANGE`,
        name,
        value,
      };
    },
    blur: (name, value) => {
      return {
        type: `${key}.BLUR`,
        name,
        value,
      };
    },
    focus: (name) => {
      return {
        type: `${key}.FOCUS`,
        name,
      };
    },
    submit: (values) => {
      return {
        type: `${key}.SUBMIT`,
        values,
      };
    },
    reset: () => {
      return {
        type: `${key}.RESET`,
      };
    },
  };

  const actions: FormModelActions<Key, Values> = {
    assignChangeToState: assign((context, event) => {
      const newValues: Values = {
        ...context[key].values,
        [event.name]: event.value,
      };
      return {
        [key]: {
          ...context[key],
          values: newValues,
          errors: config.validate?.(newValues) || {},
        },
      } as FormContext<Key, Values>;
    }),
    assignBlurToState: assign((context, event) => {
      const newValues: Values = {
        ...context[key].values,
        [event.name]: event.value,
      };

      return {
        [key]: {
          ...context[key],
          values: newValues,
          errors: config.validate?.(newValues) || {},
        },
      } as FormContext<Key, Values>;
    }),
    assignFocusToState: assign((context, event) => {
      return {
        [key]: {
          ...context[key],
          touched: {
            ...context[key].touched,
            [event.name]: true,
          },
        },
      } as unknown as FormContext<Key, Values>;
    }),
    assignSubmitToState: assign((context, event) => {
      return {
        [key]: {
          ...context[key],
          submitCount: context[key].submitCount + 1,
        },
      } as unknown as FormContext<Key, Values>;
    }),
    reset: assign((context, event) => {
      return {
        [key]: makeInitialStateFromConfig(config),
      } as unknown as FormContext<Key, Values>;
    }),
  };

  const createState = <
    TContext extends FormContext<Key, Values>,
    TEvent extends EventObject,
  >(
    config: StateNodeConfig<TContext, any, TEvent>,
  ): StateNodeConfig<TContext, any, TEvent> => {
    return {
      ...config,
      on: {
        [`${key}.CHANGE`]: {
          actions: [actions.assignChangeToState],
        },
        [`${key}.BLUR`]: {
          actions: [actions.assignBlurToState],
        },
        [`${key}.FOCUS`]: {
          actions: [actions.assignFocusToState],
        },
        [`${key}.RESET`]: {
          actions: [actions.reset],
        },
        ...config.on,
      },
    };
  };

  const initialContext = makeInitialStateFromConfig(config);

  const getIsDirty: FormModelSelectors<Key, Values>["getIsDirty"] = (
    context,
  ) => {
    return Object.values(context[key].touched).some(Boolean);
  };

  const selectors: FormModelSelectors<Key, Values> = {
    getIsValid: (context) => {
      return Object.keys(context[key].errors).length === 0;
    },
    getIsDirty,
    getIsPristine: (context) => !getIsDirty(context),
  };

  return {
    key,
    initialContext,
    events,
    createState,
    selectors,
    actions,
    makeHandlers: (context, send) => {
      const register = (name: keyof Values): RegisterOutput => {
        return {
          name: name as string,
          onChange: (e: { target: { value: string } }) => {
            send(events.change(name, e.target.value));
          },
          onBlur: (e) => {
            send(events.blur(name, e.target.value));
          },
          onFocus: (e) => {
            send(events.focus(name));
          },
          value: context[key].values[name] as any,
          error: context[key].errors[name] || undefined,
          touched: context[key].touched[name],
        };
      };

      return {
        register,
        onSubmit: (e) => {
          e?.preventDefault?.();
          console.log(e);
          send(events.submit({} as any));
        },
        errors: context[key].errors,
        submitCount: context[key].submitCount,
        touched: context[key].touched,
        values: context[key].values,
        reset: () => {
          send(events.reset());
        },
      };
    },
  };
};
