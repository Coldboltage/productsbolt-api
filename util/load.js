// import http from 'k6/http';
// import { sleep } from 'k6';

// export const options = {
//   vus: 50,
//   duration: '2m',
// };

// export default function () {
//   http.get(
//     'http://localhost:3000/webpage/find-all-divided-by-product-slim-product-name/true/avatar-the-last-airbender-collector-booster-box',
//     {
//       headers: {
//         Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
//       },
//     },
//   );

//   sleep(1);
// }

import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '2m',
};

export default function () {
  http.get(
    'http://localhost:3000/webpage/update-single-page/2d96eacc-dd6f-44d2-b511-cc027fdc1050',
    {
      headers: {
        Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    },
  );

  sleep(5);
}
