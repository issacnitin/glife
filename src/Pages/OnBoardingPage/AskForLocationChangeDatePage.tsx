import * as React from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import DateTimePicker from "react-native-modal-datetime-picker";
import { OnBoardingPageController } from './OnBoardingPageController';
import { Page } from '../../Modals/ApplicationEnums';

interface IProps {
    setPage: any
}

interface IState {
    lastHome: string
    showPicker: boolean
}

export class AskForLocationChangeDatePage extends React.Component<IProps, IState> {

    cachedDate: Date;
    Controller: OnBoardingPageController;
    cursor: number;

    constructor(props: IProps) {
        super(props)
        this.state = {
            showPicker: false,
            lastHome: ""
        }
        
        this.Controller = new OnBoardingPageController()
        this.cursor = this.Controller.GetAllHomesData().length - 1;
        this.cachedDate = this.Controller.GetCachedDate()
        
        this.loadState()
    }

    loadState = async() => {
        this.setState({
            lastHome: (await this.Controller.GetLastHomeData()).name
        })
    }

    onCalenderPress = (ev: any) => {
        this.setState({
            showPicker: true
        })
    }

    onCalenderConfirm = (date: Date) => {
        this.Controller.onCalenderConfirm(this.cursor-1, date)
        this.cachedDate = date;
        this.Controller.SetCachedDate(date);
        this.setState({
            showPicker: false
        })
    }

    onCalenderCancel = () => {
        this.setState({
            showPicker: false
        })
    }

    onNextButtonClick = () => {
        this.props.setPage(Page[Page.ASKFORLOCATION])
    }

    render() {
        return (
            <View>
                {
                    <View>
                        <Text style={{ marginTop: 50, fontSize: 32, color: 'white', textAlign: 'center', fontFamily: 'AppleSDGothicNeo-Regular', padding: 20 }}>When did you move to {this.state.lastHome}?</Text>
                        <Text style={{ marginTop: 50, fontSize: 22, color: 'white', textAlign: 'center', fontFamily: 'AppleSDGothicNeo-Regular', padding: 20 }}>{this.Controller.getDateFromTimestamp(this.cachedDate.getTime())}</Text>
                        <Button title={"Pick date"} onPress={this.onCalenderPress}/>
                    </View>
                }

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 100, backgroundColor: 'white', borderRadius: 10, padding: 10 }} onPress={this.onNextButtonClick}>
                    <Text style={{ fontSize: 22 }}>Next</Text>
                </TouchableOpacity>
                <DateTimePicker
                    date={this.cachedDate}
                    isVisible={this.state.showPicker}
                    onConfirm={this.onCalenderConfirm.bind(this)}
                    onCancel={this.onCalenderCancel.bind(this)}
                />
            </View>
        )
    }
}