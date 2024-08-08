import React from "react";
import { render, act } from "@testing-library/react";
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils";
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
  useFragment,
} from "react-relay";
import { generate as payloadGenerator } from "@graphitation/graphql-js-operation-payload-generator";
import { schema } from "./buildSchema";
import { parse as parseGraphQL } from "graphql";

const Test = () => {
  const data = useLazyLoadQuery(
    graphql`
      query TestGraphitationQuery @relay_test_operation {
        messageSlice_MessageSliceConnection(first: 1) {
          edges {
            node {
              actorDisplayName
              id
              isRead
              messagePreview
              __typename
              ...TestGraphitation_messageSliceItem
              ... on MessageSlice_SampleMessageSliceItemExtended {
                extendedField
              }
            }
          }
        }
      }
    `,
    {}
  );
  return (
    <div>
      <TestWithFragment
        data={data.messageSlice_MessageSliceConnection.edges[0].node}
      />
    </div>
  );
};

const TestWithFragment = ({ data }) => {
  const { timestamp } = useFragment(
    graphql`
      fragment TestGraphitation_messageSliceItem on MessageSlice_MessageSliceItem {
        timestamp
      }
    `,
    data
  );

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
            MessageSlice_SampleMessageSliceItemExtended(context) {
              spyOnExtendedTypeResolver();

              return {
                extendedField: "EXTENDED",
              };
            },

            MessageSlice_MessageSliceItem(context) {
              spyOnAbstractTypeResolver();

              return {
                actorDisplayName: "AUTHOR",
                timestamp: "TIMESTAMP_FOO",
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
