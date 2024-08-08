import React from "react";
import { render, act } from "@testing-library/react";
import { createMockEnvironment, MockPayloadGenerator } from "relay-test-utils";
import {
  graphql,
  RelayEnvironmentProvider,
  useLazyLoadQuery,
  useFragment
} from "react-relay";

const Test = () => {
  const data = useLazyLoadQuery(
    graphql`
      query TestQuery @relay_test_operation {
        messageSlice_MessageSliceConnection(first: 1) {
          edges {
            node {
              actorDisplayName
              id
              isRead
              messagePreview
              __typename
              ...Test_messageSliceItem
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
  return <div><TestWithFragment data={data.messageSlice_MessageSliceConnection.edges[0].node} /></div>;
};

const TestWithFragment = ({data}) => {
  const { timestamp } = useFragment(
    graphql`
      fragment Test_messageSliceItem on MessageSlice_MessageSliceItem {
        timestamp
      }
    `,
    data
  );

  return <div></div>
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
          MessageSlice_SampleMessageSliceItemExtended() {
            spyOnExtendedTypeResolver();

            return {
              extendedField: "EXTENDED",
            };
          },

          MessageSlice_MessageSliceItem() {
            spyOnAbstractTypeResolver();

            return {
              actorDisplayName: "AUTHOR",
              timestamp: "TIMESTAMP_FOO"
            };
          },
        });
      });
    });
    expect(spyOnExtendedTypeResolver).toHaveBeenCalled();
    expect(spyOnAbstractTypeResolver).toHaveBeenCalled();
  });
});
