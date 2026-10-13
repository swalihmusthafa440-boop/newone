import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import './slider.css'

export default function Slider() {
  return (
    <Swiper
      className="allbanner"
      modules={[Autoplay]}
      autoplay={{ delay: 1500 }}
      loop={true}
      slidesPerView={1.20}
      spaceBetween={5}
    >
      <SwiperSlide >
        <a href="meesho.com"><img src="/images/firstad.webp" alt="banner1" /></a> 
      </SwiperSlide>

      <SwiperSlide >
        <a href="facebook.com"><img src="/images/secondad.webp" alt="banner2" /></a>
      </SwiperSlide>

      <SwiperSlide >
        <a href="whatsapp.com"><img src="/images/thirdad.webp" alt="banner3" /></a>
      </SwiperSlide>
      <SwiperSlide >
        <a href="instagram.com"><img src="/images/forthad.webp" alt="banner4" /></a>
      </SwiperSlide>
            <SwiperSlide >
        <a href="facebook.com"><img src="/images/secondad copy.webp" alt="banner2" /></a>
      </SwiperSlide>

    </Swiper>
  );
}