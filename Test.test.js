import React from "react";
import { render, act } from "@testing-library/react";
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils";
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
  useFragment,
} from "react-relay";

const Test = () => {
  const data = useLazyLoadQuery(
    graphql`
      query TestQuery @relay_test_operation {
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
  console.log("RELAY DATA", JSON.stringify(data, null, 2));
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
        return MockPayloadGenerator.generate(operation, {
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
        });
      });
    });
    expect(spyOnExtendedTypeResolver).toHaveBeenCalled();
    expect(spyOnAbstractTypeResolver).toHaveBeenCalled();
  });
});
