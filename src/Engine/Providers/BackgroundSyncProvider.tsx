import { ProfileModal } from "../Modals/ProfileModal";
import {Md5} from 'ts-md5/dist/md5';
import { TripUtils } from '../Utils/TripUtils';
import { TripModal } from '../Modals/TripModal';
import AsyncStorage from "@react-native-community/async-storage";
import * as Engine from "../Engine";
import { StepModal } from "../Modals/StepModal";

export class BackgroundSyncProvider {

    ProfileData: ProfileModal

    constructor() {
        this.ProfileData = new ProfileModal()
        this.Sync()
    }

    Sync = async() => {
        if(!Engine.Instance || Engine.Instance.AppState.engineLoaded != Engine.EngineLoadStatus.Full) {
            setTimeout(this.Sync, 1000)
            return
        }
        try {
            console.log("Syncing")
            this.ProfileData = Engine.Instance.Modal
            for(var _trip of this.ProfileData.trips) {
                var trip = new TripModal()
                trip.CopyConstructor(_trip)
                console.log(trip)
                await trip.GenerateBase64Images()
                var _trip = await this.TrimTripForUpload(trip)
                var serverHash = await TripUtils.GetTripCheckSumServer(_trip)
                var clientHash = Md5.hashStr(_trip.toString())
                if(serverHash.Hash != clientHash) {
                    _trip.syncComplete = false
                    // console.log("Server hash: " + JSON.stringify(serverHash))
                    // console.log("Client hash: " + clientHash)
                    // console.log("Server client hash mismatch, uploading")
                    // console.log(trip)
                    
                    await TripUtils.SaveTrip(trip)
                } else {
                    _trip.syncComplete = true
                }
            }
        } catch (err) {
            console.log(err)
        }
        setTimeout(this.Sync, 1000)   
    }

    TrimTripForUpload = async(trip: TripModal) => {
        trip._masterPicBase64 = await AsyncStorage.getItem(trip.masterPicURL) || ""
        trip.masterPicURL = "";
        var steps = []
        for(var step of trip.steps) {
            console.log("TrimTripForUpload")
            console.log(step)
            var _s = new StepModal()
            _s.CopyConstructor(step)
            console.log(_s)
            for(var image of _s.imageUris) {
                var _i = await AsyncStorage.getItem(image) || ""
                _s._imageBase64.push(_i)
            }
            _s.imageUris = []

            _s._masterImageBase64 = await AsyncStorage.getItem(_s.masterImageUri) || ""
            delete _s.imageUris
            delete _s.masterImageUri
            steps.push(step)
        }
        trip.steps = steps
        var _trip: TripModal = new TripModal()
        _trip.CopyConstructor(trip)

        delete _trip.masterPicURL
        return _trip
    }

}