import React from "react";
import { render, act } from "@testing-library/react";
import { createMockEnvironment } from "relay-test-utils";
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
} from "react-relay";
import { generate as payloadGenerator } from "@graphitation/graphql-js-operation-payload-generator";
import { schema } from "./buildSchema";
import { parse as parseGraphQL } from "graphql";

const Test = () => {
  const data = useLazyLoadQuery(
    graphql`
      query TestGraphitationQuery @relay_test_operation {
        fieldL1 {
          name
          fieldL2 {
            name
            ... on ExtendedConcreteTypeL2 {
              extendedField
            }
            fieldL3 {
              name
            }
          }
        }
      }
    `,
    {}
  );
  console.log("GRAPHITATION DATA", JSON.stringify(data, null, 2));
  return <div></div>;
};

describe("Test", () => {
  it("test", async () => {
    const environment = createMockEnvironment();
    render(
      <RelayEnvironmentProvider environment={environment}>
        <React.Suspense fallback="Loading...">
          <Test />
        </React.Suspense>
      </RelayEnvironmentProvider>
    );

    const spyOnExtendedTypeResolver = jest.fn();
    const spyOnAbstractTypeResolver = jest.fn();

    await act(async () => {
      environment.mock.resolveMostRecentOperation((operation) => {
        const { data } = payloadGenerator(
          {
            schema,
            request: {
              variables: operation.request.variables,
              node: parseGraphQL(operation.request.node.params.text),
            },
          },
          {
            AbstractTypeL2() {
              spyOnAbstractTypeResolver();
              return {
                name: "ABSTRACT_TYPE_L2",
              };
            },
            ExtendedConcreteTypeL2() {
              spyOnExtendedTypeResolver();
              return {
                extendedField: "EXTENDED_FIELD",
              };
            },
          }
        );

        // Create a copy of the data which creates objects with prototypes,
        // because graphql-js doesn't do this and it makes it impossible for
        // relay to use Object.prototype methods on the data.
        // eslint-disable-next-line msteams/no-json-stringify
        return { data: JSON.parse(JSON.stringify(data)) };
      });
    });

    expect(spyOnExtendedTypeResolver).toHaveBeenCalled();
    expect(spyOnAbstractTypeResolver).toHaveBeenCalled();
  });
});
