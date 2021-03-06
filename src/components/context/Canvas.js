import React, {Component} from "react";
import { Stage, Layer} from 'react-konva';
import CustomizeCanvasOperation from './CustomizeCanvasOperation';
import CustomizeCanvasArrow from "./CustomizeCanvasArrow";
import ParametarsModal from "./ParametarsModal";
import ButtonCSMP from "../controllers/ButtonCSMP";
import TooltipCSMP from "../controllers/TooltipCSMP";
import OptionsModal from "./OptionsModal";



class Canvas extends Component{
    constructor(props){
        super(props);
        this.state = {
            selectedIndex: null,
            referenceIndex: null,
            selectedPosition: null,
            referencePosition: null,
            selectedItem: null,
            referencedItem: null,
            selectedArrow: null,
            optionsModal: false,
            stageScale: 1,
            // stageX: 0,
            // stageY: 0
        };
        this.myRef = React.createRef();
    }

    renderCanvasOperations = () => {
        return this.props.currentItems.map((item,index) =>{
                return (
                    <CustomizeCanvasOperation
                        key={'_' +item.OperationID}
                        referenceIndex={this.state.referenceIndex}
                        getPositionOfOperation={this.getPositionOfOperation}
                        selectedOperation={this.state.selectedIndex}
                        changeSelectedOperation={this.changeSelectedOperation}
                        makeReferenceIndex={this.makeReferenceIndex}
                        onPositionChange={this.onPositionChange}
                        item={item}
                        index={index}
                    />
                )
            })
    };

    handleWheel = e => {
        e.evt.preventDefault();

        const scaleBy = 1.02;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        this.setState({
            stageScale: newScale,
            stageX:
                -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            stageY:
                -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
        });
    };

    changeRelationshipsPosition = (e,index)=>{
        let obj = {
            x: ((e.evt.x - this.props.resizableWidth) * (1/this.state.stageScale)),
            y: (e.evt.y * (1/this.state.stageScale))
        };
        let relationShips = this.props.relationShips.slice();
        relationShips.forEach((part, count) => {
            if(part['first_node'] === index){
                part['first_node_position'] = obj;
            }else if(part['second_node'] === index){
                part['second_node_position'] = obj;
            }
        });
        this.props.updateRelationships(relationShips)
    };



    onPositionChange = (e,index)=>{
        this.changeRelationshipsPosition(e,index);
    };

    updateDataForRelationship = (changed) =>{
        let selectedPosition = this.state.selectedPosition;
        let referencePosition = this.state.referencePosition;

        selectedPosition['x'] = selectedPosition['x'] * 1/this.state.stageScale;
        selectedPosition['y'] = selectedPosition['y'] * 1/this.state.stageScale;
        referencePosition['x'] = referencePosition['x'] * 1/this.state.stageScale;
        referencePosition['y'] = referencePosition['y'] * 1/this.state.stageScale;

        if(this.state.referencedItem.inputsArray.length + 1 <= this.state.referencedItem.maxInputs){
            this.state.referencedItem.inputsArray.push({node: this.state.selectedItem, location: changed});
            this.onAddingRelationship({'first_node': this.state.selectedIndex, 'first_node_ref':this.state.selectedItem, 'first_node_position': selectedPosition, 'second_node':this.state.referenceIndex, 'second_node_position':referencePosition, 'second_node_ref':this.state.referencedItem})
            this.state.selectedItem['export'] = this.state.referencedItem;
        }
    };


    openModalOnRelationships = (changed) =>{
        this.updateDataForRelationship(changed);
        this.unSelectOperation();
        this.props.modalClose();
    };


    getPositionOfOperation = (e, param) =>{
        if(param ==='referencedOperation'){
            this.setState({referencePosition: e.target.getStage().getPointerPosition()}, () =>{
                if (this.state.referenceIndex != null && this.state.selectedIndex != null) {
                    if(this.state.referenceIndex !== this.state.selectedIndex){
                        this.props.onModalOpen();
                    }
                }
            })
        }else{
            this.setState({selectedPosition: e.target.getStage().getPointerPosition()})
        }
    };

    changeSelectedOperation = (selectedIndex, selectedItem) =>{
        this.setState({selectedIndex, selectedItem});
        this.props.changeSelectedItem(selectedItem);
    };

    makeReferenceIndex = (referenceIndex, referencedItem) =>{
            this.setState({referenceIndex, referencedItem});
    };

    onAddingRelationship = (relationship) =>{
        if(this.state.referencedItem.maxInputs !== 0){
            this.props.onAddingRelationship(relationship);
        }
    };

    renderArrows = () =>{
        return this.props.relationShips.map((item, index) =>{
            return (
                <CustomizeCanvasArrow key={'_' +index} node1={item.second_node_position} node2={item.first_node_position}/>
            )
        })
    };

    unSelectOperation = () =>{
        this.setState({selectedPosition: null, selectedIndex: null, selectedItem: null, referenceIndex: null, referencePosition: null, referencedItem: null});
        this.props.changeSelectedItem(null)
    };

    deleteNode = () =>{
        let deletedRelatioships = [];
        let currentItems = this.props.currentItems.slice();
        let relationships = this.props.relationShips.slice();

        if(currentItems.indexOf(this.state.selectedItem) >= 0){
            currentItems.splice(currentItems.indexOf(this.state.selectedItem),1)
        }

        for (let i = 0; i < currentItems.length; i++) {
            for (let j = 0; j < currentItems[i].inputsArray.length; j++) {
                if(this.state.selectedItem.OperationID === currentItems[i].inputsArray[j].node.OperationID){
                    currentItems[i].inputsArray.splice(j,1);
                }
            }
        }
            relationships.forEach((item, index) =>{
            if(item['first_node_ref'] === this.state.selectedItem){
                deletedRelatioships.push(item);
            } else if(item['second_node_ref'] === this.state.selectedItem){
                deletedRelatioships.push(item);
            }
        });

        let difference = relationships.filter(x => !deletedRelatioships.includes(x));

        this.props.updateCurrentItems(currentItems);
        this.props.updateRelationships(difference);
        this.unSelectOperation();
    };

    exportData = () =>{
        this.props.onExportData();
    };

    openOptionsModal = () =>{
        this.setState({optionsModal: true})
    };

    closeOptionsModal = () =>{
        this.setState({optionsModal: false})
    };

    closeOptionsModalAndSaveData = (data) =>{
        this.props.saveOptionsData(data);
        this.closeOptionsModal();
    };

    renderOptionsModal = () =>{
        if(this.state.optionsModal === true){
            return <OptionsModal modalOpen={this.state.optionsModal} optionsModal={this.state.optionsModal} onModalSaveAndClose={this.closeOptionsModalAndSaveData} closeOptionsModal={this.closeOptionsModal}/>
        }
    };


    render(){
        return (
            <div  className='canvas_context' style={{width: window.screen.width - this.props.resizableWidth - 300}}>
                {this.renderOptionsModal()}
                {this.props.modalOpen ? <ParametarsModal modalClose={this.props.modalClose} openModalOnRelationships={this.openModalOnRelationships} referencedItem={this.state.referencedItem} modalOpen={this.props.modalOpen} modalMode={this.props.modalMode} onAddingOperation={this.props.onAddingOperation} item={this.props.addedItem}/> : null }
                <Stage
                    onWheel={this.handleWheel}
                    onDblClick={this.unSelectOperation}
                    width={window.innerWidth - this.props.resizableWidth - 100}
                    height={window.innerHeight}
                    scaleX={this.state.stageScale}
                    scaleY={this.state.stageScale}
                    // x={this.state.stageX}
                    // y={this.state.stageY}
                >
                    <Layer>
                        {this.renderCanvasOperations()}
                        {this.renderArrows()}
                    </Layer>
                </Stage>
                <div className={'options_canvas'}>
                    <ButtonCSMP onClick={this.openOptionsModal} text={'Options'} variant={'outlined'} className={'export_button'}/>
                    <ButtonCSMP onClick={this.deleteNode} text={'Delete'} variant={'outlined'} color="secondary" className={'delete_button'}/>
                    <ButtonCSMP onClick={this.exportData} text={'Export'} variant={'outlined'} className={'export_button'}/>
                    <TooltipCSMP className={'tooltip_csmp'} title={global._info}/>
                </div>
            </div>
        );
    }
}

export default Canvas;