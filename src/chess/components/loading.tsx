import * as React from 'react';

export const Loading = () => {
  return (
    <div id='loading'>
      <div>Loading...</div>
      <div className='lds-ring'><div></div><div></div><div></div><div></div></div>
    </div>
  );
};
