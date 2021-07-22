import { useMachine } from "@xstate/react";
import { createMachine } from "xstate";
import { createFormModel } from "../lib/createFormService";
import { ContextFromFormModel, EventsFromFormModel } from "../lib/types";

const formModel = createFormModel("loginForm", {
  initialValues: {
    username: "",
    password: "",
  },
  validate: (values) => {
    if (!values.username) {
      return {
        username: "You must pass a username!",
      };
    }
  },
});

const machine = createMachine<
  ContextFromFormModel<typeof formModel>,
  EventsFromFormModel<typeof formModel>
>({
  initial: "gettingDetails",
  context: {
    loginForm: formModel.initialContext,
  },
  states: {
    gettingDetails: formModel.createState({
      on: {
        "loginForm.SUBMIT": {
          cond: formModel.selectors.getIsValid,
          actions: [
            formModel.actions.assignSubmitToState,
            (context: ContextFromFormModel<typeof formModel>) => {
              alert(JSON.stringify(context.loginForm));
            },
          ],
        },
      },
    }),
  },
});

const NextPage = () => {
  const [state, send] = useMachine(machine);

  const formInfo = formModel.makeHandlers(state.context, send);

  return (
    <form onSubmit={formInfo.onSubmit}>
      <input {...formInfo.register("username")} placeholder="username"></input>
      <input {...formInfo.register("password")} placeholder="password"></input>
      <pre>{JSON.stringify(formInfo.errors)}</pre>
      <button type="submit">Submit</button>
      <button type="reset" onClick={formInfo.reset}>
        Reset
      </button>
    </form>
  );
};

export default NextPage;
