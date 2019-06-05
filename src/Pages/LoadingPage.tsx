import * as React from 'react';
import { Text,Platform, View, StyleSheet, ViewStyle, TextStyle, ImageProgressEventDataIOS, ProgressViewIOS, ProgressBarAndroid } from 'react-native';
import Spinner from '../UIComponents/Spinner';
import * as PhotoLibraryProcessor from '../Utilities/PhotoLibraryProcessor';
import ImageDataModal from '../Modals/ImageDataModal';
import { MapPhotoPageModal } from '../Modals/MapPhotoPageModal';
import { ClusterModal } from '../Modals/ClusterModal';
import { ClusterProcessor } from '../Utilities/ClusterProcessor';
import { StepModal } from '../Modals/StepModal';
import { TripModal } from '../Modals/TripModal';
import { TravelUtils } from '../Utilities/TravelUtils';
import { BlobSaveAndLoad } from '../Utilities/BlobSaveAndLoad';
import { Page } from '../Modals/ApplicationEnums';

interface Styles {
    spinnerContainer: ViewStyle,
    infoText: TextStyle
};

var styles = StyleSheet.create<Styles>({
    spinnerContainer: {
        flex: 5,
        alignSelf: 'center'
    },
    infoText: {
        flex: 9,
        fontFamily: 'AppleSDGothicNeo-Regular',
        fontSize: 28,
        textAlign: 'center',
        padding: '20%',
        alignSelf: 'center',
        color:'white'
    }
});

interface IProps {
    onDone: (data: any) => void,
    setNavigator: any
}

interface IState {
    finished: number,
    total: number
}

export default class LoadingPage extends React.Component<IProps, IState> {

    dataToSendToNextPage: MapPhotoPageModal = new MapPhotoPageModal([]);
    homesDataForClustering: {[key:number]: ClusterModal} = {}
    homes: {latitude: number, longitude: number, timestamp: number}[]  = []
    myData: any
    retryCount = 20;
    constructor(props:any) {
        super(props);

        this.props.setNavigator(false)

        this.myData = BlobSaveAndLoad.Instance.getBlobValue(Page[Page.LOADING])

        this.state = {
            finished: 0,
            total: 100
        }

        this.loadHomes();
    }

    loadHomes = async() => {
        var i = 0;
        for(var element of this.myData) {
            await TravelUtils.getCoordinatesFromLocation(element.name)
                .then((res) => {
                    if(res.length <= 0) return;
                    // Taking first home only, when multiple places can have same name
                    // Fix this bug, TODO:
                    res = res[0];
                    this.homes.push({
                        latitude: Number.parseFloat(res.lat),
                        longitude: Number.parseFloat(res.lon),
                        timestamp: (element.timestamp as number)
                    })
                    i++;
                    if(i == this.myData.length) this.initialize();
                })
        }
    }

    render() {
        return (
            <View style={{width: '100%', justifyContent:'center', flex: 1}}>
                <Text style={styles.infoText}>Going through your photo library</Text>
                <View style={{width: "60%", alignSelf: 'center'}}>
                {
                    Platform.OS == 'ios' ? 
                        <ProgressViewIOS progressViewStyle={'bar'} progress={this.state.finished/this.state.total}/>
                    : 
                        <ProgressBarAndroid progress={this.state.finished/this.state.total}/>
                }
                </View>
                <View style={styles.spinnerContainer}>
                    <Spinner/>
                </View>
            </View>
        );
    }

    // Helper methods
    initialize () {

        // Expanding homes to timestamp
        var endTimestamp = Math.floor((new Date()).getTime()/8.64e7);
        console.log("Expanding homes..")

        this.homes.sort((a, b) => {
            return b.timestamp - a.timestamp;
        })

        for(var data of this.homes) {
            console.log(endTimestamp)
            console.log(data)
            while((endTimestamp--) >= Math.floor(data.timestamp/8.64e7)) this.homesDataForClustering[endTimestamp] = data as ClusterModal;
            console.log(endTimestamp)
        }

        PhotoLibraryProcessor.getPhotosFromLibrary()
        .then((photoRollInfos: Array<ImageDataModal>) => {
    
            var markers = PhotoLibraryProcessor.getMarkers(photoRollInfos);
            var timelineData: Array<number> = PhotoLibraryProcessor.getTimelineData(photoRollInfos);

            var clusterData: Array<ClusterModal> = [];
            for(var i = 0; i < markers.length; i++) {
                if(photoRollInfos[i].timestamp < endTimestamp) continue;
                clusterData.push({
                    image: photoRollInfos[i].image,
                    latitude: markers[i].latitude, 
                    longitude: markers[i].longitude, 
                    timestamp: timelineData[i],
                    id: i} as ClusterModal )
            }

            BlobSaveAndLoad.Instance.setBlobValue(Page[Page.NEWTRIP], this.homesDataForClustering); 

            var trips = ClusterProcessor.RunMasterClustering(clusterData, this.homesDataForClustering);
            this.setState({
                total: trips.length
            })
            i = 0;
            var asynci = 0;
            for(var trip of trips) {
                trip.sort((a: ClusterModal, b: ClusterModal) => {
                    return a.timestamp-b.timestamp
                });
                
                this.populateTripModalData(ClusterProcessor.RunStepClustering(trip), i)
                .then((res) => {
                    this.dataToSendToNextPage.trips.push(res);
                    asynci++;

                    this.setState({
                        finished: asynci
                    })

                    this.dataToSendToNextPage.countriesVisited.push.apply(this.dataToSendToNextPage.countriesVisited, res.countryCode)

                    if(asynci == trips.length) {
                        let x = (countries: string[]) => countries.filter((v,i) => countries.indexOf(v) === i)
                        this.dataToSendToNextPage.countriesVisited = x(this.dataToSendToNextPage.countriesVisited); // Removing duplicates
                        this.dataToSendToNextPage.percentageWorldTravelled = Math.floor(this.dataToSendToNextPage.countriesVisited.length*100/186)
                        this.dataToSendToNextPage.trips.sort((a, b) => {
                            return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                        })
                        for(var i = 0; i < this.dataToSendToNextPage.trips.length; i++) this.dataToSendToNextPage.trips[i].tripId = i;
                        this.dataToSendToNextPage.coverPicURL = "https://cms.hostelworld.com/hwblog/wp-content/uploads/sites/2/2017/08/girlgoneabroad.jpg"
                        this.dataToSendToNextPage.profilePicURL = "https://lakewangaryschool.sa.edu.au/wp-content/uploads/2017/11/placeholder-profile-sq.jpg"
                        this.props.onDone(this.dataToSendToNextPage);
                    }
                })
                i++;
            }

        })
    }

    async populateTripModalData (steps: StepModal[], tripId: number) {
        var tripResult : TripModal = new TripModal();

        var homeStep = this.homesDataForClustering[Math.floor(steps[0].startTimestamp/8.64e7)-1]
        homeStep.timestamp = Math.floor(steps[0].startTimestamp - 8.64e7)
        var _stepModal = new StepModal()
        _stepModal.meanLatitude = homeStep.latitude
        _stepModal.meanLongitude = homeStep.longitude
        _stepModal.startTimestamp = homeStep.timestamp
        _stepModal.endTimestamp = homeStep.timestamp
        _stepModal.id = 0;
        _stepModal.distanceTravelled = 0;
        _stepModal.location = "Home";
        tripResult.tripAsSteps.push(_stepModal)
        
        var i = 0;
        var countries: string[] = []
        var places: string[] = []

        var tripName = "";
        for(var step of steps) {
            if(i > 0)
            step.distanceTravelled = Math.floor(tripResult.tripAsSteps[i-1].distanceTravelled + 
                ClusterProcessor.EarthDistance({latitude: step.meanLatitude, longitude: step.meanLongitude} as ClusterModal,
                {latitude: tripResult.tripAsSteps[i-1].meanLatitude, longitude: tripResult.tripAsSteps[i-1].meanLongitude} as ClusterModal))
            tripResult.tripAsSteps.push(step);
            i++;
        }

        homeStep = this.homesDataForClustering[Math.floor(steps[steps.length-1].endTimestamp/8.64e7)+1]
        homeStep.timestamp = Math.floor(steps[steps.length-1].endTimestamp + 8.64e7)

        var _stepModal = new StepModal()
        _stepModal.meanLatitude = homeStep.latitude
        _stepModal.meanLongitude = homeStep.longitude
        _stepModal.startTimestamp = homeStep.timestamp
        _stepModal.endTimestamp = homeStep.timestamp
        _stepModal.id = (tripResult.tripAsSteps.length+1)*100
        _stepModal.location = "Home";
        _stepModal.distanceTravelled = Math.floor(tripResult.tripAsSteps[i-1].distanceTravelled + 
            ClusterProcessor.EarthDistance({latitude: _stepModal.meanLatitude, longitude: _stepModal.meanLongitude} as ClusterModal,
            {latitude: tripResult.tripAsSteps[i-1].meanLatitude, longitude: tripResult.tripAsSteps[i-1].meanLongitude} as ClusterModal))


        tripResult.tripAsSteps.push(_stepModal)
        i++;

        // Load locations
        for(var step of steps) {
            await TravelUtils.getLocationFromCoordinates(step.meanLatitude, step.meanLongitude)
            .then((res) => {
                if(res && res.address && (res.address.county || res.address.state_district)) {
                    step.location = res.address.county || res.address.state_district
                    if(countries.indexOf(res.address.country) == -1) {
                        if(countries.length == 0) tripName = (res.address.country)
                        else tripName += (", " + res.address.country)
                        countries.push(res.address.country)
                    }
                    if(places.indexOf(step.location) == -1) {
                        places.push(step.location)
                    }
                    tripResult.countryCode.push((res.address.country_code as string).toLocaleUpperCase())
                }
            })

            // Showing current weather now
            await TravelUtils.getWeatherFromCoordinates(step.meanLatitude, step.meanLongitude)
            .then((res) => {
                if(res && res.main) {
                    if(step.location == "" ) {
                        step.location = res.name
                        places.push(step.location)
                    }
                    step.temperature = Math.floor(Number.parseFloat(res.main.temp)-273.15) + "ºC"
                }
            })
        }

        tripResult.tripId = tripId;
        tripResult.masterPicURL = steps[steps.length-1].masterImageUri;
        tripResult.daysOfTravel = Math.abs(Math.floor(steps[steps.length-1].endTimestamp/8.64e7) - Math.floor(steps[0].startTimestamp/8.64e7))
        // Handling edge case
        if(tripResult.daysOfTravel == 0) tripResult.daysOfTravel = 1;
        
        tripResult.distanceTravelled = tripResult.tripAsSteps[tripResult.tripAsSteps.length - 1].distanceTravelled
        tripResult.startDate = TravelUtils.getDateFromTimestamp(steps[0].startTimestamp);
        tripResult.endDate = TravelUtils.getDateFromTimestamp(steps[steps.length-1].endTimestamp);
        tripResult.location = {
            // TODO: Fix this, country visited is not first step, first step is home
            latitude: tripResult.tripAsSteps[1].meanLatitude,
            longitude: tripResult.tripAsSteps[1].meanLongitude,
            latitudeDelta: 0,
            longitudeDelta: 0
        };
        tripResult.temperature = steps[steps.length-1].temperature;

        if(countries.length == 1) {
            // Only home country, use places
            tripName = ""
            var index = 0;
            for(var place of places) {
                if(index == 0) {
                    tripName = place
                } else 
                tripName += ", " + place 
                if(index == 2) break;
                index++;
            }
        }
        tripResult.title = tripName

        return  tripResult
    }
       
}