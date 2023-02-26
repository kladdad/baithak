"use client";

import React from "react";
import Protected from "../../../components/auth/protected";
import EntityList, { EntityInfo } from "../../../components/common/entityList";
import { searchVenues } from "../../../graphql/venues";
import { graphql } from "../../../__generated__";
import { VenueDetailsFragment } from "../../../__generated__/graphql";

export default function VenueList() {
  const descFn = (venue: VenueDetailsFragment) => {
    return venue.name;
  };

  return (
    <Protected>
      <EntityList
        entityInfo={
          new EntityInfo<VenueDetailsFragment>(
            "Venue",
            "Venues",
            "venues",
            searchVenues,
            deleteVenue
          )
        }
        descFn={descFn}
      />
    </Protected>
  );
}

const deleteVenue = graphql(`
  mutation deleteVenue($id: Int!) {
    deleteVenue(id: $id) {
      id
    }
  }
`);
