import Hero from "@/components/home/Hero";
import Philosophy from "@/components/home/Philosophy";
import RoomsRail from "@/components/home/RoomsRail";
import Experiences from "@/components/home/Experiences";
import GalleryMarquee from "@/components/home/GalleryMarquee";
// import FilmSection from "@/components/home/FilmSection";
import LocationSection from "@/components/home/LocationSection";
import GuestNotes from "@/components/home/GuestNotes";
import BlogTeaser from "@/components/home/BlogTeaser";
import ClosingCTA from "@/components/home/ClosingCTA";
import BookingPopup from "@/components/BookingPopup";
import { getDisplayReviews } from "@/lib/googleReviews";
import { getExperiences, getGallery, getRooms, getRoomsTotal } from "@/lib/cmsContent";

import { pageMeta } from "@/lib/metadata";

export const revalidate = 300;

export const metadata = pageMeta({
  title: "Jade River Resort — Life, Slowed by the River",
  description:
    "A thirteen-room luxury boutique resort in Pahalgam on the banks of the Lidder. Wooden architecture, pine forest and direct booking only.",
  path: "/",
});

export default async function HomePage() {
  const [{ reviews, mapsUrl }, rooms, roomsTotal, experiences, gallery] =
    await Promise.all([
      getDisplayReviews(),
      getRooms(),
      getRoomsTotal(),
      getExperiences(),
      getGallery(),
    ]);

  return (
    <>
      <Hero roomsTotal={roomsTotal} />
      <Philosophy roomsTotal={roomsTotal} />
      <RoomsRail rooms={rooms} roomsTotal={roomsTotal} />
      <Experiences experiences={experiences} />
      <GalleryMarquee items={gallery} />
      {/* <FilmSection /> */}
      <LocationSection />
      <GuestNotes reviews={reviews} googleMapsUrl={mapsUrl} roomsTotal={roomsTotal} />
      <BlogTeaser />
      <ClosingCTA roomsTotal={roomsTotal} />
      <BookingPopup />
    </>
  );
}
