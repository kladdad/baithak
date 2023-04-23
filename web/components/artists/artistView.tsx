import React from "react";
import Image from "next/image";
import { imageUrl } from "utils";
import Markdown from "../concert/markdown";
import PageHeader from "../common/pageHeader";
import { FragmentType, getFragmentData } from "../../__generated__";
import { artistDetails } from "../../graphql/artists";

interface ArtistViewProps {
  artistData: FragmentType<typeof artistDetails>;
}

export default function ArtistView(props: ArtistViewProps) {
  const artist = getFragmentData(artistDetails, props.artistData);
  const imageSrc = artist.photoUrl ? imageUrl(artist.photoUrl) : "/images/placeholder.png";

  if (!artist) return null;

  return (
    <div>
      <PageHeader title={`${artist.title ? artist.title : ""} ${artist.name}`} />
      <Image src={imageSrc} width={600} height={450} alt="Artist photo" className="mx-auto" />
      <div className="p-2 mt-4 mb-4">{artist.bio && <Markdown>{artist.bio}</Markdown>}</div>
      <div className="flex mb-4 justify-center">
        {artist.youtubeVideoIds &&
          artist.youtubeVideoIds.map((youtubeVideoId, index) =>
            youtubeVideoId.length > 0 ? (
              <iframe
                width="420"
                height="315"
                key={index}
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              />
            ) : null
          )}
      </div>
    </div>
  );
}