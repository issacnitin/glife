import { StepModal } from "../../Modals/StepModal";
import Region from "../../Modals/Region";
import { TripUtils } from "../../Engine/TripUtils";
import { BlobSaveAndLoad } from "../../Engine/BlobSaveAndLoad";
import { Page } from "../../Modals/ApplicationEnums";

export class TripExplorePageModal {
    tripId: number
    tripAsSteps: StepModal[]
    location : Region
    title: string
    countryCode: string[]
    temperature : string
    daysOfTravel: number
    distanceTravelled : number
    activities: Array<string>
    startDate: string
    endDate: string
    masterPicURL: string

    
    constructor() {
        this.tripId = 0;
        this.tripAsSteps = [];
        this.location = {} as Region
        this.temperature = ""
        this.daysOfTravel = 0
        this.distanceTravelled = 0
        this.activities = []
        this.startDate = ""
        this.endDate = ""
        this.title = ""
        this.countryCode = []
        this.masterPicURL = ""
        
        var trip: TripExplorePageModal = BlobSaveAndLoad.Instance.getBlobValue(Page[Page.TRIPEXPLORE])
        if(trip != undefined)
            this.CopyConstructor(trip)
    }

    Save = () => {
        BlobSaveAndLoad.Instance.setBlobValue(Page[Page.TRIPEXPLORE], this)
    }

    CopyConstructor = (trip: TripExplorePageModal) => {
        this.tripId = trip.tripId;
        this.tripAsSteps = trip.tripAsSteps;
        this.location = trip.location;
        this.temperature = trip.temperature;
        this.daysOfTravel = trip.daysOfTravel;
        this.distanceTravelled = trip.distanceTravelled;
        this.activities = trip.activities;
        this.startDate = trip.startDate;
        this.endDate = trip.endDate;
        this.title = trip.title;
        this.countryCode = trip.countryCode;
        this.masterPicURL = trip.masterPicURL
    }

    populateAll = () => {
        this.populateMasterPic();
        this.populateDaysOfTravel();
        this.populateDistanceTravelled();
        this.populateDates();
        this.populateLocation();
        this.populateTemperature();
    }

    populateMasterPic = () => {
        this.masterPicURL = this.tripAsSteps[this.tripAsSteps.length-2].masterImageUri;
    }

    populateDaysOfTravel = () => {
        this.daysOfTravel =  Math.abs(Math.floor(this.tripAsSteps[this.tripAsSteps.length-1].endTimestamp/8.64e7) - Math.floor(this.tripAsSteps[0].startTimestamp/8.64e7))
        this.daysOfTravel = this.daysOfTravel == 0 ? 1 : this.daysOfTravel;
    }

    populateDistanceTravelled = () => {
        this.distanceTravelled = this.tripAsSteps[this.tripAsSteps.length-1].distanceTravelled;
    }

    populateDates = () => {
        this.startDate = TripUtils.getDateFromTimestamp(this.tripAsSteps[0].startTimestamp);
        this.endDate = TripUtils.getDateFromTimestamp(this.tripAsSteps[this.tripAsSteps.length - 1].endTimestamp);
    }

    populateLocation = () => {            
        // TODO: Fix this, country visited is not first step, first step is home
        this.location = {
            latitude: this.tripAsSteps[1].meanLatitude,
            longitude: this.tripAsSteps[1].meanLongitude,
            latitudeDelta: 0,
            longitudeDelta: 0
        } as Region
    }

    populateTemperature = () => {
        this.temperature = this.tripAsSteps[1].temperature;
    }

    populateTitle = (countries: Array<string>, places: Array<string>) => {
        
        var tripName = "";
        if(countries.length == 1) {
            // Only home country, use places
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
        else {
            var i = 0;
            for(var country of countries) {
                if(i == 0) tripName += country
                else tripName += ", " + country
                i++;
            } 
        }
        this.title = tripName
    }

}