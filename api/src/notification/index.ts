import { Marked } from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import * as Eta from "https://deno.land/x/eta@v1.12.3/mod.ts";
import { sendEmail } from "../email/index.ts";

const upcomingConcertQuery = `
  query($today: LocalDateTime) {
    concerts(where: {startTime: {gt: $today}}, orderBy: {startTime: ASC}, limit: 1) {
      id
      title
      startTime
      main: concertArtists(where: {isMain: {eq: true}}, orderBy: {rank: ASC}) {
        artist {
          name
        }
      }
      accompany: concertArtists(where: {isMain: {eq: false}}, orderBy: {rank: ASC}) {
        artist {
          name
        }
      }
    }
  }
`;
const query = `
  query ($id: Int!) {
    notification(id: $id) {
      subject
      message
      postMessage      
      concert {
        id
        title
        description
        venue {
          name
          street
          city
          state
          zip          
        }
        startTime
        endTime
        photoUrl
        memberPrice
        nonMemberPrice
        main: concertArtists(where: {isMain: {eq: true}}, orderBy: {rank: ASC}) {
          artist {
            name
          }
          instrument
        }
        accompany: concertArtists(where: {isMain: {eq: false}}, orderBy: {rank: ASC}) {
          artist {
            name
          }
          instrument
        }
      }
    }
  }
`;

export async function formatNotification(
  concertNotificationId: number,
  exograph: Exograph
): Promise<string> {
  const fileServerUrl = Deno.env.get("FILE_SERVER_URL");
  const hostUrl = Deno.env.get("HOST_URL");
  const concertTemplate = await Deno.readTextFile("./src/notification/concertTemplate.html");
  Eta.templates.define("concertPartial", Eta.compile(concertTemplate));
  let template = await Deno.readTextFile("./src/notification/notificationTemplate.html");
  const templateFunction = Eta.compile(template);

  const notification = (await exograph.executeQuery(query, { id: concertNotificationId }))
    .notification;
  const concert = notification.concert;
  const message = Marked.parse(notification.message).content;
  const postMessage = Marked.parse(notification.postMessage).content;
  const description = concert ? Marked.parse(concert.description).content : "";
  const nextConcertReferenceDate = concert
    ? concert.startTime
    : new Date().toISOString().slice(0, -1);
  const upcomingConcerts = (
    await exograph.executeQuery(upcomingConcertQuery, { today: nextConcertReferenceDate })
  ).concerts;
  const upcomingConcert = upcomingConcerts.length > 0 ? upcomingConcerts[0] : null;

  try {
    template = templateFunction(
      { notification, fileServerUrl, hostUrl, message, postMessage, upcomingConcert, description },
      Eta.config
    );
  } catch (e) {
    console.log("***** template", e);
    throw e;
  }

  return template;
}

const subscribersQuery = `
  query($group: String) {
    subscriptions(where: {group: {eq: $group}}) {
      email
    }
  }
`;

export async function emailNotification(
  concertNotificationId: number,
  emailGroupName: string,
  exograph: Exograph
): Promise<string> {
  const notification = (await exograph.executeQuery(query, { id: concertNotificationId }))
    .notification;
  const notificationText = await formatNotification(concertNotificationId, exograph);
  const subscribers = await exograph.executeQuery(subscribersQuery, { group: emailGroupName });
  const subject = notification.subject;
  const toFrom = Deno.env.get("EMAIL_NOTIFICATION_FROM_ADDRESS");

  try {
    const bccs: [string] = subscribers.subscriptions.map((s) => s.email);

    await sendEmail({
      subject: subject,
      message: notificationText,
      to: toFrom,
      from: toFrom,
      cc: bccs,
    });
    return "success";
  } catch (e) {
    console.log(e);
  }
}
