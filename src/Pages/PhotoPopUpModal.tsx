import * as React from 'react';
import { View, Modal, SafeAreaView, TouchableHighlight, Text, ScrollView, Image, TextInput, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StepModal } from '../Modals/StepModal';


interface IProps {
    photoModalVisible: boolean
    lastStepClicked: StepModal
    bottom: number
    onDismiss: () => void
    onDescriptionChange: (text: string) => void
    onModalClose: () => void
}

interface IState {

}

const deviceWidth = Dimensions.get('window').width;

export class PhotoPopUpModal extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props)
    }

    render() {
        return (<Modal
            animationType='fade'
            visible={this.props.photoModalVisible}
            transparent={true}
            onDismiss={this.props.onDismiss} >

            <SafeAreaView style={{ margin: 30, borderRadius: 10, bottom: this.props.bottom, flex: 1, alignContent: 'center', justifyContent: 'center' }}>
                <LinearGradient colors={['#98FB98', '#50C878', '#00A572']}>
                    <View style={{
                        borderRadius: 10
                    }}>
                        <View>


                            <TouchableHighlight
                                onPress={this.props.onModalClose}
                                style={{ padding: 10 }}>
                                <Text>X</Text>
                            </TouchableHighlight>
                            <ScrollView horizontal={true} //scrolling left to right instead of top to bottom
                                scrollEventThrottle={10} //how often we update the position of the indicator bar
                                pagingEnabled={true} //scrolls from one image to the next, instead of allowing any value inbetween
                                style={{ aspectRatio: 1 }}
                                snapToAlignment='center'
                                snapToInterval={deviceWidth - 60}
                                decelerationRate={0}
                                stickyHeaderIndices={[0]}
                            >
                                {
                                    this.props.lastStepClicked.imageUris.map((imageUri, index) => (
                                        imageUri != "" ?
                                            <View style={{ width: deviceWidth - 60, height: deviceWidth - 60, alignContent: 'center', backgroundColor: 'black' }} key={index}>
                                                <Image
                                                    resizeMode='contain'
                                                    style={{ width: deviceWidth - 60, height: deviceWidth - 60 }} source={{ uri: imageUri }}
                                                />
                                            </View>
                                            : <View />
                                    ))
                                }
                            </ScrollView>
                            <View style={{ height: '10%', padding: 2 }}>
                                <TextInput multiline={true} editable={true} onChangeText={this.props.onDescriptionChange}
                                    style={{
                                        backgroundColor: '#4c669f',
                                        borderRadius: 5,
                                        padding: 5,
                                        color: 'black'
                                    }}
                                    onFocus={
                                        () => {
                                            this.setState({
                                                modalBottom: 200
                                            })
                                        }
                                    }

                                    onBlur={
                                        () => {
                                            this.setState({
                                                modalBottom: undefined
                                            })
                                        }
                                    }
                                >{this.props.lastStepClicked.description}</TextInput>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        </Modal>
        )
    }
}