import Advisory from "components/advisory";
import { ConcertRsvp } from "components/concert/concertRsvp";
import ConcertView from "components/concert/concertView";
import { graphql } from "__generated__";
import { ssrApolloClient } from "./apollo-client";
import { getServerDateTime } from "utils";

// TODO: Update this time once https://github.com/vercel/next.js/issues/59883 is fixed
export const revalidate = 0;

export default async function Home() {
  const concertData = await getFrontPageConcert();

  if (!concertData) return null;

  return (
    <>
      <Advisory />
      <div className="main-container">
        <ConcertView concert={concertData} />
      </div>
      <ConcertRsvp concertId={concertData?.id} />
    </>
  );
}

async function getFrontPageConcert() {
  const today = new Date();

  const { data: upcomingConcert } = await ssrApolloClient.query({
    query: getUpcomingConcert,
    variables: { today: getServerDateTime(today) },
  });
  const { data: lastConcert } = await ssrApolloClient.query({
    query: getLastConcert,
    variables: { today: getServerDateTime(today) },
  });

  if (upcomingConcert && upcomingConcert.concerts && upcomingConcert.concerts.length > 0) {
    return upcomingConcert.concerts[0];
  } else if (lastConcert && lastConcert.concerts && lastConcert.concerts.length > 0) {
    return lastConcert.concerts[0];
  }
}

const getUpcomingConcert = graphql(`
  query getUpcomingConcert($today: LocalDateTime) {
    concerts(where: { startTime: { gte: $today } }, orderBy: { startTime: ASC }) {
      id
      ...ConcertDetails
    }
  }
`);

const getLastConcert = graphql(`
  query getLastConcert($today: LocalDateTime) {
    concerts(where: { startTime: { lte: $today } }, orderBy: { startTime: DESC }) {
      id
      ...ConcertDetails
    }
  }
`);
