import {Image} from 'react-native';
import {Region} from 'react-native-maps';

export class StepModal {
    meanLatitude: number
    meanLongitude: number
    startTimestamp: number
    endTimestamp: number
    timelineData: string[]
    imageUris: string[]
    markers: Region[]

    constructor() {
        this.meanLatitude = 0;
        this.meanLongitude = 0;
        this.startTimestamp = 0;
        this.endTimestamp = 0;
        this.imageUris = []
        this.timelineData = [];
        this.markers = [];
    }
}