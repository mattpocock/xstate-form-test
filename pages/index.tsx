import { useMachine } from "@xstate/react";
import { useMemo } from "react";
import { createMachine } from "xstate";
import { createFormModel } from "../lib/createFormService";
import { ContextFromFormModel, EventsFromFormModel } from "../lib/types";

const formModel = createFormModel("initialDetailsForm", {
  initialValues: {
    name: "",
    email: "",
  },
  validate: (values) => {
    if (!values.name) {
      return {
        name: "You must pass a name",
      };
    }
    if (!values.email) {
      return {
        email: "You must pass an email",
      };
    }
  },
});

const formMachine = createMachine<
  ContextFromFormModel<typeof formModel>,
  EventsFromFormModel<typeof formModel>
>({
  initial: "gettingDetails",
  context: {
    initialDetailsForm: formModel.initialContext,
  },
  states: {
    gettingDetails: formModel.createState({
      on: {
        "initialDetailsForm.SUBMIT": [
          {
            cond: formModel.selectors.getIsValid,
            target: "pending",
          },
          {
            actions: formModel.actions.assignSubmitToState,
          },
        ],
      },
    }),
    pending: {
      invoke: {
        src: async (context) => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (!confirm(JSON.stringify(context.initialDetailsForm))) {
                reject("Oh no!");
              } else {
                resolve("");
              }
            }, 2000);
          });
        },
        onDone: {
          target: "gettingDetails",
          actions: () => alert("Yay!"),
        },
        onError: {
          target: "gettingDetails",
          actions: () => alert("Nooooo"),
        },
      },
    },
  },
});

export default function Home() {
  const [state, send] = useMachine(formMachine);

  const { register, onSubmit, reset } = useMemo(
    () => formModel.makeHandlers(state.context, send),
    [state.context, send],
  );

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "200px",
            padding: "1rem",
          }}
        >
          <input
            style={{ marginBottom: "1rem" }}
            {...register("name")}
            placeholder="Name"
          ></input>

          <input
            style={{ marginBottom: "1rem" }}
            {...register("email")}
            placeholder="Email"
            type="email"
          ></input>
          {state.context.initialDetailsForm.submitCount > 0 &&
            !formModel.selectors.getIsValid(state.context) && (
              <pre>
                {JSON.stringify(state.context.initialDetailsForm.errors)}
              </pre>
            )}
          <button>{state.matches("pending") ? "Loading..." : "Submit"}</button>
          <button type="reset" onClick={reset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
