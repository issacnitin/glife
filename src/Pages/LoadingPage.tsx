import * as React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle, AsyncStorage, ImageProgressEventDataIOS } from 'react-native';
import Spinner from '../UIComponents/Spinner';
import {Page, months} from '../Modals/ApplicationEnums';
import * as PhotoLibraryProcessor from '../Utilities/PhotoLibraryProcessor';
import ImageDataModal from '../Modals/ImageDataModal';
import { MapPhotoPageModal } from '../Modals/MapPhotoPageModal';
import { ClusterModal } from '../Modals/ClusterModal';
import { ClusterProcessor } from '../Utilities/ClusterProcessor';
import { StepModal } from '../Modals/StepModal';
import { TripModal } from '../Modals/TripModal';
import { TravelUtils } from '../Utilities/TravelUtils';

interface Styles {
    spinnerContainer: ViewStyle,
    infoText: TextStyle
};

var styles = StyleSheet.create<Styles>({
    spinnerContainer: {
        flex: 1,
        marginLeft: 80,
        marginTop: 200,
    },
    infoText: {
        marginLeft: 80,
        marginTop: 300
    }
});

interface IProps {
    onDone: (data: any) => void,
    homes: {[key:number]: ClusterModal}
}

interface IState {

}

export default class LoadingPage extends React.Component<IProps, IState> {

    dataToSendToNextPage: MapPhotoPageModal = new MapPhotoPageModal([]);

    constructor(props:any) {
        super(props);
        this.initialize();
    }

    render() {
        return (
            <View>
                <Text style={styles.infoText}>Going through your photo library</Text>
                <View style={styles.spinnerContainer}>
                    <Spinner/>
                </View>
            </View>
        );
    }

    // Helper methods
    initialize () {
        PhotoLibraryProcessor.getPhotosFromLibrary()
        .then((photoRollInfos: Array<ImageDataModal>) => {
    
            var markers = PhotoLibraryProcessor.getMarkers(photoRollInfos);
            var timelineData: Array<number> = PhotoLibraryProcessor.getTimelineData(photoRollInfos);

            var clusterData: Array<ClusterModal> = [];
            for(var i = 0; i < markers.length; i++) {
                clusterData.push({
                    image: photoRollInfos[i].image,
                    latitude: markers[i].latitude, 
                    longitude: markers[i].longitude, 
                    timestamp: timelineData[i],
                    id: i} as ClusterModal )
            }

            // Expanding homes to timestamp
            var homesDataForClustering: {[key:number]: ClusterModal} = {}
            var initialTimestamp = 0;
            var endTimestamp = 0;
            for(var data in this.props.homes) {
                endTimestamp = Math.floor(this.props.homes[data].timestamp/8.64e7)
                if(Number.isNaN(endTimestamp)) //Current day
                    endTimestamp = Math.floor((new Date()).getTime()/8.64e7)
                for(var i = initialTimestamp; i <= endTimestamp; i++) {
                    homesDataForClustering[i] = this.props.homes[data]
                }
                initialTimestamp = endTimestamp;
            }
            var trips = ClusterProcessor.RunMasterClustering(clusterData, homesDataForClustering);

            i = 0;
            for(var trip of trips) {
                trip.sort((a: ClusterModal, b: ClusterModal) => {
                    if(a.timestamp < b.timestamp) return 0
                    return 1
                });
                var _trip: TripModal = this.populateTripModalData(ClusterProcessor.RunStepClustering(trip), i)
                this.dataToSendToNextPage.trips.push(_trip);
                i++;
            }

            this.props.onDone(this.dataToSendToNextPage);
        });
    }

    populateTripModalData = (steps: StepModal[], tripId: number) => {
        var tripResult : TripModal = new TripModal();
        var distanceTravelled = 0;

        var i = 0;
        for(var step of steps) {
            var initialDate = new Date(steps[0].startTimestamp);
            var finalDate = new Date(steps[steps.length-1].endTimestamp);
    
            var timelineData : Array<string> = []
    
            while( initialDate.getTime() <= finalDate.getTime() ) {
                var dateInStringFormat = initialDate.getDate().toString() + " " + months[initialDate.getMonth()] + " " 
                + initialDate.getFullYear().toString();
                timelineData.push(dateInStringFormat);
                initialDate = new Date(initialDate.getTime() + 86400);
            }

            step.timelineData = timelineData;
            tripResult.tripAsSteps.push(step);

            if(i > 0)
            distanceTravelled += ClusterProcessor.EarthDistance({latitude: tripResult.tripAsSteps[i].meanLatitude, longitude: tripResult.tripAsSteps[i].meanLongitude} as ClusterModal,
                                {latitude: tripResult.tripAsSteps[i-1].meanLatitude, longitude: tripResult.tripAsSteps[i-1].meanLongitude} as ClusterModal)
            i++;
        }

        tripResult.tripId = tripId;
        tripResult.daysOfTravel = Math.floor(Math.abs(steps[steps.length-1].endTimestamp - steps[0].startTimestamp)/8.64e7)
        tripResult.distanceTravelled = Math.floor(distanceTravelled)
        tripResult.startDate = TravelUtils.getDateFromTimestamp(steps[0].startTimestamp);
        tripResult.endDate = TravelUtils.getDateFromTimestamp(steps[steps.length-1].endTimestamp);
        TravelUtils.getLocationFromCoordinates(steps[0].meanLatitude, steps[0].meanLongitude).then((res) => {
            tripResult.location = res
        })

        // console.log("TRIP")
        console.log(tripResult)
        // Populate remaining data of TripModal
        return tripResult;
    }
       
}