import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';

import PartnersProgresBar from './partnersProgresBar';
import messages from './messages';
import { OHSOME_STATS_BASE_URL } from '../../config';

export const Activity = ({ partner }) => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      let primaryHashtag = partner.primary_hashtag.trim();
      if (primaryHashtag.startsWith('#')) {
        primaryHashtag = primaryHashtag.slice(1);
      }
      primaryHashtag = primaryHashtag.toLowerCase();

      const secondaryHashtags = partner.secondary_hashtag
        .split(',')
        .map((tag) => tag.trim().replace('#', '').toLowerCase())
        .join(',');
      const response = await fetch(
        OHSOME_STATS_BASE_URL + `/stats/hashtags/${primaryHashtag},${secondaryHashtags}`,
      );

      if (response.ok) {
        const jsonData = await response.json();
        const formattedData = formatData(jsonData.result);
        setData(formattedData);
      } else {
        console.error('Error fetching data:', response.statusText);
      }
    } catch (error) {
      console.error('Error processing the request:', error);
    }
  };

  const formatData = (rawData, limit) => {
    const groupedData = {};

    Object.keys(rawData).forEach((primary, index) => {
      if (index >= limit) return;
      Object.entries(rawData[primary]).forEach(([secondary, value]) => {
        if (secondary !== 'latest' && secondary !== 'changesets' && secondary !== 'users') {
          if (!groupedData[secondary]) {
            groupedData[secondary] = [];
          }

          groupedData[secondary].push({
            primary,
            secondary: typeof value === 'string' ? parseFloat(value) : value,
          });
        }
      });
    });

    const formattedData = Object.entries(groupedData).map(([action, values]) => ({
      label: action,
      data: sortBySecondaryDescending(values),
    }));

    return formattedData;
  };

  function sortBySecondaryDescending(data) {
    return data.sort((a, b) => b.secondary - a.secondary);
  }

  useEffect(() => {
    if (!partner.id) return;
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner]);

  return (
    <ReactPlaceholder showLoadingAnimation={true} rows={26} ready={data} className="pv3  ph4-ns ">
      <div className="graphics-container">
        {data &&
          data.map((series) => {
            const maxValue = series.data.reduce(
              (max, item) => (item.secondary > max ? item.secondary : max),
              0,
            );
            return (
              <div key={series.label} className="pa3 shadow-4 bg-white">
                <div
                  className="flex space-between"
                  style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid grey',
                  }}
                >
                  <p>Team</p>
                  <h3 className="f3 fw6 ttu barlow-condensed blue-dark mv1">
                    <FormattedMessage {...messages[series.label]} />
                  </h3>
                </div>
                <div
                  className="flex flex-column"
                  style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    gap: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  {series.data.map((dataItem) => (
                    <div key={dataItem.primary}>
                      <div className="blue-grey">
                        {dataItem ? <></> : <FormattedMessage {...messages.noPartnersGroup} />}
                      </div>
                      <div key={dataItem.primary}>
                        <PartnersProgresBar
                          className="pb3 bg-white"
                          totalData={maxValue}
                          label={series.label}
                          value={dataItem.secondary}
                          percentValidated={(dataItem.secondary * 100) / maxValue}
                          data={dataItem}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </ReactPlaceholder>
  );
};
