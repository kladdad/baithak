import React, { useState } from "react";
import Image from "next/image";
import ConcertView from "./concertView";
import PreviewContainer from "../common/previewContainer";
import { getSimpleDateTime } from "../../app/page";
import { artistBasicInfo, concertArtistInfo, concertDetails } from "../../graphql/concert";
import { FragmentType, getFragmentData, makeFragmentData } from "../../__generated__";
import { venueDetails } from "../../graphql/venues";
import { getDateTimeStr, handleFileUpload, imageUrl } from "../../utils";
import PageHeader from "../common/pageHeader";
import {
  ArtistBasicInfoFragment,
  ConcertArtistCreationInputFromConcert,
  ConcertArtistInfoFragment,
  ConcertArtistUpdateInputFromConcertNested,
  ConcertDetailsFragment,
} from "../../__generated__/graphql";
import ConcertArtistsEditor from "./concertArtistsEditor";

type ConcertEditorProps = {
  concertId?: number;
  concertData?: FragmentType<typeof concertDetails>;
  venues: ({ id: number } & FragmentType<typeof venueDetails>)[];
  artists: FragmentType<typeof artistBasicInfo>[];
  done: Function;
};

export type ConcertArtistInfo = Omit<ConcertArtistInfoFragment, "artist"> & {
  artist: { id: number };
};

export type ConcertArtistEditInfo = Partial<ConcertArtistInfo>;

const newConcert = {
  title: "",
  description: "",
  venue: { id: 1 },
  photoUrl: "",
  ticketLink: "",
  memberPrice: 0,
  nonMemberPrice: 0,
  publish: false,
  mainArtists: [],
  accompanyingArtists: [],
  startTime: getSimpleDateTime(new Date()),
  endTime: getSimpleDateTime(new Date()),
};

export default function ConcertEditor(props: ConcertEditorProps) {
  const concert = getFragmentData(concertDetails, props.concertData);
  const artists = getFragmentData(artistBasicInfo, props.artists);
  const venues = props.venues.map((v) => {
    return { ...getFragmentData(venueDetails, v), id: v.id };
  });
  const [concertData, setConcertData] = useState(concert ? concert : newConcert);
  const [concertArtists, setConcertArtists] = useState<ConcertArtistEditInfo[]>(
    [...concertData.mainArtists, ...concertData.accompanyingArtists].map((artistData) => {
      const concertArtist = getFragmentData(concertArtistInfo, artistData);
      return {
        id: concertArtist.id,
        artist: {
          id: concertArtist.artist.id,
        },
        isMain: concertArtist.isMain,
        rank: concertArtist.rank,
        instrument: concertArtist.instrument,
      };
    })
  );

  const enableSave =
    concertData.venue && concertData.startTime && concertData.endTime && concertArtists.length > 0;

  const concertForView: ConcertDetailsFragment = {
    ...concertData,
    mainArtists: concertArtists
      .filter((ca) => ca.isMain)
      .map((ca) => {
        const artist = artists.find((a) => a.id === ca.artist?.id);
        return { ...ca, artist: { id: artist?.id, name: artist?.name, title: artist?.title } };
      }),
    accompanyingArtists: concertArtists
      .filter((ca) => !ca.isMain)
      .map((ca) => {
        const artist = artists.find((a) => a.id === ca.artist?.id);
        return { ...ca, artist: { id: artist?.id, name: artist?.name, title: artist?.title } };
      }),
    venue: props.venues.filter((v) => v.id === concertData.venue.id)[0],
  };

  function changeTitle(e: React.ChangeEvent<HTMLInputElement>) {
    setConcertData({ ...concertData, title: e.currentTarget.value });
  }

  function changeVenue(e: React.ChangeEvent<HTMLSelectElement>) {
    setConcertData({
      ...concertData,
      venue: { ...concertData.venue, id: parseInt(e.currentTarget.value) },
    });
  }

  function changeStartDateTime(e: React.ChangeEvent<HTMLInputElement>) {
    const date = new Date(Date.parse(e.target.value));
    const endDate = new Date(Date.parse(e.target.value));
    endDate.setHours(date.getHours() + 3);
    setConcertData({
      ...concertData,
      startTime: getSimpleDateTime(date),
      endTime: getSimpleDateTime(endDate),
    });
  }

  function changeEndDateTime(e: React.ChangeEvent<HTMLInputElement>) {
    const date = new Date(Date.parse(e.target.value));
    setConcertData({ ...concertData, endTime: getSimpleDateTime(date) });
  }

  function changeDescription(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setConcertData({ ...concertData, description: e.currentTarget.value });
  }

  function changeMemberPrice(e: React.ChangeEvent<HTMLInputElement>) {
    setConcertData({ ...concertData, memberPrice: parseFloat(e.currentTarget.value) });
  }

  function changeNonMemberPrice(e: React.ChangeEvent<HTMLInputElement>) {
    setConcertData({ ...concertData, nonMemberPrice: parseFloat(e.currentTarget.value) });
  }

  function changeTicketLink(e: React.ChangeEvent<HTMLInputElement>) {
    setConcertData({ ...concertData, ticketLink: e.currentTarget.value });
  }

  function changePublish(e: React.ChangeEvent<HTMLInputElement>) {
    setConcertData({ ...concertData, publish: e.target.checked });
  }

  const saveConcert = async () => {
    if (props.concertId) {
      const originalCAIds = [...concertData.mainArtists, ...concertData.accompanyingArtists].map(
        (artistData) => {
          const concertArtist = getFragmentData(concertArtistInfo, artistData);
          return { id: concertArtist.id };
        }
      );
      const newCAIds = concertArtists.flatMap((ca) => ca.id);
      const createArr: ConcertArtistCreationInputFromConcert[] = [];
      const deleteArr = originalCAIds.filter((val) => !newCAIds.includes(val.id));
      const updateArr: ConcertArtistUpdateInputFromConcertNested[] = [];
      Array.from(concertArtists.entries()).forEach(([_, concertArtist]) => {
        const artist = concertArtist.artist;
        if (concertArtist.id && artist?.id) {
          const concertArtistToSave = {
            id: concertArtist.id,
            artist: { id: artist.id },
            rank: concertArtist.rank ? concertArtist.rank : 0,
            isMain: concertArtist.isMain,
            instrument: concertArtist.instrument,
          };
          updateArr.push(concertArtistToSave);
        } else {
          if (concertArtist.artist?.id) {
            const concertArtistToSave = {
              artist: { id: concertArtist.artist.id },
              rank: concertArtist.rank ? concertArtist.rank : 0,
              isMain: concertArtist.isMain ? concertArtist.isMain : false,
              instrument: concertArtist.instrument ? concertArtist.instrument : "",
            };
            createArr.push(concertArtistToSave);
          }
        }
      });
      const concertUpdate = {
        title: concertData.title,
        description: concertData.description,
        memberPrice: concertData.memberPrice,
        nonMemberPrice: concertData.nonMemberPrice,
        photoUrl: concertData.photoUrl,
        ticketLink: concertData.ticketLink,
        startTime: concertData.startTime,
        endTime: concertData.endTime,
        publish: concertData.publish,
        venue: { id: concertData.venue.id },
        concertArtists: {
          create: createArr,
          update: updateArr,
          delete: deleteArr,
        },
      };
      props.done(concertUpdate);
    } else {
      const concertArtistsToSave = concertArtists.map((concertArtist) => {
        const concertArtistToSave = {
          artist: { id: concertArtist.artist?.id },
          rank: concertArtist.rank ? concertArtist.rank : 0,
          isMain: concertArtist.isMain,
          instrument: concertArtist.instrument,
        };
        return concertArtistToSave;
      });
      const concertCreation = {
        title: concertData.title,
        description: concertData.description,
        memberPrice: concertData.memberPrice ? concertData.memberPrice : 0,
        nonMemberPrice: concertData.nonMemberPrice ? concertData.nonMemberPrice : 0,
        photoUrl: concertData.photoUrl,
        ticketLink: concertData.ticketLink,
        startTime: concertData.startTime,
        endTime: concertData.endTime,
        publish: concertData.publish,
        venue: { id: concertData.venue.id },
        concertArtists: concertArtistsToSave,
      };
      props.done(concertCreation);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const updatedPhotoUrl = await handleFileUpload(file);
      if (updatedPhotoUrl) setConcertData({ ...concertData, photoUrl: updatedPhotoUrl });
    }
  };

  return (
    <>
      <div className="main-container">
        <PageHeader title={"Concert"} />
        <div className="flex-auto p-4 max-lg:p-0">
          <ConcertArtistsEditor
            artists={artists as ArtistBasicInfoFragment[]}
            concertArtists={concertArtists}
            updateConcertArtists={setConcertArtists}
          />
          <div className="form-row">
            <label className="form-label">Title</label>
            <input
              className="simple-input w-auto col-span-2"
              placeholder="Title"
              onChange={changeTitle}
              value={concertData.title}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea
              className="border col-span-3 p-2"
              rows={5}
              placeholder="Concert description"
              onChange={changeDescription}
              value={concertData.description}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Venue</label>
            <select className="simple-input" onChange={changeVenue} value={concertData.venue.id}>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label className="form-label">Start date</label>
            <input
              className="simple-input"
              type="datetime-local"
              value={getDateTimeStr(concertData.startTime)}
              step={15 * 60}
              onChange={(date) => changeStartDateTime(date)}
            />
          </div>
          <div className="form-row">
            <label className="form-label">End date</label>
            <input
              className="simple-input"
              type="datetime-local"
              value={getDateTimeStr(concertData.endTime)}
              step={15 * 60}
              onChange={(date) => changeEndDateTime(date)}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Member price</label>
            <input
              className="simple-input"
              placeholder="Member price"
              onChange={changeMemberPrice}
              value={concertData.memberPrice || 0}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Non member price</label>
            <input
              className="simple-input"
              placeholder="non-member price"
              onChange={changeNonMemberPrice}
              value={concertData.nonMemberPrice || 0}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Ticket link</label>
            <input
              className="simple-input"
              placeholder="Ticket link"
              onChange={changeTicketLink}
              value={concertData.ticketLink || ""}
            />
          </div>
          <div className="form-row">
            <label className="form-label">Photo</label>
            {concertData.photoUrl && (
              <Image
                src={imageUrl(concertData.photoUrl)}
                width={80}
                height={60}
                alt="Concert image"
              />
            )}
            <input
              type="file"
              className="col-start-2 mt-1 max-lg:col-end-5"
              accept=".png, .jpg, .jpeg"
              onChange={handlePhotoChange}
              placeholder="Upload photo"
            />
          </div>
          <div className="form-row">
            <div className="form-label">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={concertData.publish}
                onChange={changePublish}
              />
            </div>
            <div className="flex justify-start items-center">
              <label>Publish</label>
            </div>
          </div>
        </div>
        <div className="grid mb-4 max-lg:grid-cols-4 lg:grid-cols-8">
          <button
            className="text-white bg-green-600 hover:bg-green-700 col-start-3 max-lg:col-start-2 lg:ml-2"
            disabled={!enableSave}
            onClick={() => saveConcert()}
          >
            Save
          </button>
        </div>
      </div>
      <PreviewContainer className="mt-6">
        <div className="bordered-container">
          <ConcertView concert={makeFragmentData(concertForView, concertDetails)} />
        </div>
      </PreviewContainer>
    </>
  );
}
