import { ChangeEvent } from "react";
import { AssignAction, EventObject, State, StateNodeConfig } from "xstate";
import { Model } from "xstate/lib/model.types";

export interface FormModel<Key extends string, Values> {
  key: Key;
  initialContext: InitialState<Values>;
  events: FormModelEvents<Key, Values>;
  createState: <
    TContext extends FormContext<Key, Values>,
    TEvent extends EventObject,
  >(
    config: StateNodeConfig<TContext, any, TEvent>,
  ) => StateNodeConfig<TContext, any, TEvent>;
  selectors: FormModelSelectors<Key, Values>;
  actions: FormModelActions<Key, Values>;
  makeHandlers: <TContext extends FormContext<Key, Values>>(
    state: TContext,
    send: (event: any) => void,
  ) => {
    register: Register<Values>;
    onSubmit: (e: any) => void;
    values: Values;
    errors: ErrorsFromValues<Values>;
    touched: BooleanMap<Values>;
    submitCount: number;
    reset: () => void;
  };
}

export type Register<Values> = (name: keyof Values) => RegisterOutput;

export interface RegisterOutput {
  name: string;
  value: string;
  onChange: (e: any) => void;
  onBlur: (e: any) => void;
  onFocus: (e: any) => void;
  error: string | undefined;
  touched: boolean;
}

export type FormContext<Key extends string, Values> = {
  [K in Key]: InitialState<Values>;
};

export interface FormModelSelectors<Key extends string, Values> {
  getIsValid: <TContext extends FormContext<Key, Values>>(
    context: TContext,
  ) => boolean;
  getIsDirty: <TContext extends FormContext<Key, Values>>(
    context: TContext,
  ) => boolean;
  getIsPristine: <TContext extends FormContext<Key, Values>>(
    context: TContext,
  ) => boolean;
}

export interface FormModelEvents<Key extends string, Values> {
  change: <ValueName extends keyof Values>(
    name: ValueName,
    value: string,
  ) => {
    type: `${Key}.CHANGE`;
    name: ValueName;
    value: string;
  };
  blur: <ValueName extends keyof Values>(
    name: ValueName,
    value: string,
  ) => {
    type: `${Key}.BLUR`;
    name: ValueName;
    value: string;
  };
  focus: <ValueName extends keyof Values>(
    name: ValueName,
  ) => {
    type: `${Key}.FOCUS`;
    name: ValueName;
  };
  submit: (values: Values) => {
    type: `${Key}.SUBMIT`;
    values: Values;
  };
  reset: () => {
    type: `${Key}.RESET`;
  };
}

export interface FormModelActions<Key extends string, Values> {
  assignChangeToState: AssignAction<FormContext<Key, Values>, any>;
  assignBlurToState: AssignAction<FormContext<Key, Values>, any>;
  assignFocusToState: AssignAction<FormContext<Key, Values>, any>;
  assignSubmitToState: AssignAction<FormContext<Key, Values>, any>;
  reset: AssignAction<FormContext<Key, Values>, any>;
}

export type FormEvents<Key extends string, Values> = {
  [K in keyof FormModelEvents<Key, Values>]: ReturnType<
    FormModelEvents<Key, Values>[K]
  >;
}[keyof FormModelEvents<Key, Values>];

export type EventsFromFormModel<T> = T extends FormModel<
  infer Key,
  infer Values
>
  ? FormEvents<Key, Values>
  : never;

export type ContextFromFormModel<T> = T extends FormModel<
  infer Key,
  infer Values
>
  ? FormContext<Key, Values>
  : never;

export type ModelFromFormModel<T> = T extends FormModel<infer Key, infer Values>
  ? Model<FormContext<Key, Values>, FormEvents<Key, Values>>
  : never;

export interface FormModelParams<Values> {
  initialValues: Values;
  validate?: ValidateFunction<Values>;
}

export type ValidateFunction<Values> = (
  value: Values,
) => ErrorsFromValues<Values> | void;

export type ErrorsFromValues<Values> = {
  [K in keyof Values]?: string;
};

export type BooleanMap<Values> = {
  [K in keyof Values]: boolean;
};

export interface InitialState<Values> {
  errors: ErrorsFromValues<Values>;
  touched: BooleanMap<Values>;
  values: Values;
  submitCount: number;
}
