import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
// import Swiper core and required modules
import SwiperCore, { Navigation, Pagination, Scrollbar, A11y } from 'swiper';

import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/swiper.scss';
import 'swiper/swiper-bundle.css';
import 'swiper/core';
import 'swiper/components/navigation/navigation.scss';
import 'swiper/components/pagination/pagination.scss';
import 'swiper/components/scrollbar/scrollbar.scss';

// install Swiper modules
SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

export function CurrentProjects() {
  const pagination = {
    clickable: true,
  };
  const sliderItems = 'w-100';
  return (
    <Swiper
      slidesPerView={1}
      autoplay={true}
      pagination={pagination}
      modules={[Pagination]}
      scrollbar={{ draggable: true }}
      onSwiper={(swiper) => console.log(swiper)}
      onSlideChange={() => console.log('slide change')}
      style={{ width: '100%', height: 400 }}
    >
      <SwiperSlide>
        
      </SwiperSlide>
      <SwiperSlide></SwiperSlide>
      <SwiperSlide></SwiperSlide>
      <SwiperSlide></SwiperSlide>
    </Swiper>
  );
}
