import * as React from 'react'
import { Text, View, ScrollView, Image, Modal, TextInput, Button, SafeAreaView, Dimensions } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker';
import { StepModal } from '../Modals/StepModal';
import { TravelUtils } from '../Utilities/TravelUtils';
import ImageDataModal from '../Modals/ImageDataModal';
import Region from '../Modals/Region';
import { ClusterModal } from '../Modals/ClusterModal';
import { ClusterProcessor } from '../Utilities/ClusterProcessor';
import { Page } from '../Modals/ApplicationEnums';
import * as PhotoLibraryProcessor from '../Utilities/PhotoLibraryProcessor';

interface IProps {
    visible: boolean,
    onClose: (_step: StepModal|null) => void
    setPage: any
}

interface IState {
    showPicker: boolean
    imageUris: string[]
    location: string
    locationWrong: number
}

const deviceWidth = Dimensions.get('window').width

export class NewStepPage extends React.Component<IProps, IState> {
    data: any
    calenderCursor: number = 0;
    from: Date = new Date(0);
    to: Date = new Date();
    tempLocations: Array<any> = [];

    constructor(props: IProps) {
        super(props)
        this.data = {
            'images': []
        }
        this.state = {
            showPicker: false,
            imageUris: [],
            location: "",
            locationWrong: 0
        }

        PhotoLibraryProcessor.checkPhotoPermission()
        .then((res) => {
                if(!res) this.props.setPage(Page[Page.NOPERMISSIONIOS])
            }
        )
    }

    onLocationTextChange = (location: string) => {
        this.setState({
            location: location
        })
    }

    onImagePickerPress = () => {
        ImagePicker.openPicker({
            multiple: true
          }).then(images => {
            this.data['images'] = images;
            var imageUris: string[] = []
            for(var item of this.data['images']) {
                imageUris.push(item.sourceURL)
            }
            this.setState({
                imageUris: imageUris
            })
          })
    }

    onCalenderClick = (index: number) => {
        this.calenderCursor = index;
        this.setState({
            showPicker: true
        })
    }

    onPickerConfirm = (date: string) => {
        if (this.calenderCursor == 0) {
            // From date
            this.from = new Date(date)
        } else if (this.calenderCursor == 1) {
            // To date
            this.to = new Date(date);
        }
        this.setState({
            showPicker: false
        })
    }

    onPickerCancel = () => {
        this.setState({
            showPicker: false
        })
    }

    findExactName(obj: any, name: string) {
        for (var key of obj) {
            if ((key.name + ", " + key.country).trim() == name.trim()) {
                return true;
            }
        }

        return false;
    }

    removeDuplicates = (obj: any) => {
        var result: { name: string, country: string }[] = []
        for (var key of obj) {
            var t = key.display_name.split(', ')
            if (!this.findExactName(result, t[0] + ", " + t[t.length - 1]))
                result.push({
                    name: t[0],
                    country: t[t.length - 1]
                })
        }
        return result
    }


    validateData = async() => {

        this.tempLocations = []
        var locationWrong = 0;

        if(this.state.location == "") {
            this.setState({
                locationWrong: 1
            })
            return false
        }

        var res = await TravelUtils.getCoordinatesFromLocation(this.state.location)
        res = this.removeDuplicates(res)
        for (var obj of res) {
            this.tempLocations.push(obj);
        }
        if (res && res.length == 1 || (this.findExactName(res, this.state.location))) { locationWrong = 0 }
        else if (res) locationWrong = 2

        this.setState({
            locationWrong: locationWrong
        })

        return locationWrong == 0;
    }

    onDone = async() => {
        var result = await this.validateData()
        if(!result) return;

        var res = await TravelUtils.getCoordinatesFromLocation(this.state.location)
        res = res[0]

        var step = new StepModal()
        var imageDataList: Array<ImageDataModal> = []
        for (var image of this.data['images']) {
            imageDataList.push(new ImageDataModal(new Region(Number.parseFloat(res.lat), Number.parseFloat(res.lon), 0, 0), image.path, (new Date(Number.parseInt(image.creationDate) * 1000)).getTime()))
        }

        step.masterImageUri = imageDataList[0].image;

        var clusterData: Array<ClusterModal> = [];
        for (var i = 0; i < imageDataList.length; i++) {
            clusterData.push({
                image: imageDataList[i].image,
                latitude: imageDataList[i].location.latitude,
                longitude: imageDataList[i].location.longitude,
                timestamp: imageDataList[i].timestamp,
                id: i
            } as ClusterModal)
        }

        var _step = ClusterProcessor.convertClusterToStep(clusterData);
        _step.location = this.state.location
        this.props.onClose(_step)
    };
    
    setLocation = (el: any) => {
        this.setState({
            location: el.name.trim() + ", " + el.country.trim()
        })
        this.validateData()
    }

    onCloseWithoutSubmit = () => {
        this.props.onClose(null)
    }

    render() {
        return (
            <Modal visible={this.props.visible}>
                <SafeAreaView style={{
                    width: "80%",
                    height: "90%",
                    borderRadius: 10,
                    margin: 50,
                    padding: 50,
                    backgroundColor:"#00000000"
                }}>
                    <View style={{top: 0, right:0}}>
                        <Button onPress={this.onCloseWithoutSubmit}  title="X"/>
                    </View>
                <Text>Go ahead, select your images. We'll generate the step for you</Text>
                
                    
                    <ScrollView style={{ flex: 1, flexDirection:'column', alignContent: 'center', margin: 10}}>
                        <View style={{ flexDirection: 'column', marginLeft: 5, marginRight: 5, width: '80%' }}>
                            <TextInput
                                editable={true}
                                onEndEditing={this.validateData}
                                placeholder={"Location"}
                                onChangeText={(text) => this.onLocationTextChange(text)}
                                style={[{ fontSize: 22, padding: 3, color: 'black' }, { borderWidth: ((this.state.locationWrong != 0) ? 1 : 0), borderColor: ((this.state.locationWrong != 0) ? 'red' : 'black') }]}
                                textContentType={'addressCity'}
                            >{this.state.location}</TextInput>
                            {this.state.locationWrong != 0 ? <Text style={{ color: 'red', padding: 3 }} > {this.state.locationWrong == 1 ? "Try nearest city, the digital overlords can't find this place in the map" : "Be more specific, multiple places with same name exist. Try Bengaluru, India"} </Text> : <View />}
                            {this.state.locationWrong == 2 ? <Text style={{ color: 'lightgrey', padding: 3 }}>Places found: </Text> : <View />}
                            {this.state.locationWrong == 2 && this.tempLocations != undefined? 
                                this.tempLocations.map((el, index) => (
                                    <Text style={{ color: 'lightgrey' }} onPress={(e: any) => this.setLocation(el)}>{"\n " + (index+1) + ". " + el.name.trim() + ", " + el.country.trim() + "\n"}</Text>
                                )) : <View />}
                        </View>
                        <Button title={"Image Picker"} onPress={this.onImagePickerPress.bind(this)} />
                    {
                        this.state.imageUris.map((image:string) => (
                            <Image style={{width: deviceWidth*.5, height: deviceWidth*.5, alignSelf:'center'}} source={{uri: image}} />
                        ))
                    }
                    </ScrollView>
                    <Button title={"Done"} onPress={this.onDone} />
                </SafeAreaView>
            </Modal>
        )
    }
}