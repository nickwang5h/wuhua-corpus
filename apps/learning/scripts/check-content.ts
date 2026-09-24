import {checkReadings} from './readings';
console.log(`${(await checkReadings()).length} MDX readings validated.`);
