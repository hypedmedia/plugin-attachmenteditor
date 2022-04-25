import * as alt from 'alt-client';
import { Vector3 } from 'alt-worker';
import * as native from 'natives';
import { WebViewController } from '../../../../client/extensions/view2';
import ViewModel from '../../../../client/models/viewModel';
import { isAnyMenuOpen } from '../../../../client/utility/menus';
import { AttachmentEditorEvents } from '../../shared/enums/events';

const view = await WebViewController.get();
const PAGE_NAME = 'AttachmentEditor';
let createdObject: number | undefined;

class InternalFunctions implements ViewModel {
    static async open() {
        if (isAnyMenuOpen()) {
            return;
        }

        await WebViewController.setOverlaysVisible(false);

        const view = await WebViewController.get();
        view.on(`${PAGE_NAME}:Ready`, InternalFunctions.ready);
        view.on(`${PAGE_NAME}:Close`, InternalFunctions.close);

        WebViewController.openPages([PAGE_NAME]);
        WebViewController.focus();
        WebViewController.showCursor(true);

        alt.toggleGameControls(false);

        alt.Player.local.isMenuOpen = true;
    }

    static async close() {
        alt.toggleGameControls(true);
        WebViewController.setOverlaysVisible(true);

        const view = await WebViewController.get();
        view.off(`${PAGE_NAME}:Ready`, InternalFunctions.ready);
        view.off(`${PAGE_NAME}:Close`, InternalFunctions.close);

        WebViewController.closePages([PAGE_NAME]);

        WebViewController.unfocus();
        WebViewController.showCursor(false);

        alt.Player.local.isMenuOpen = false;
    }

    static async ready() {
        const view = await WebViewController.get();
        view.emit(`${PAGE_NAME}:SendSomeData`, 'hello world');
    }
}

view.on(
    AttachmentEditorEvents.emitDataToClient,
    (
        data: { prop: string; boneId: number; dict: string; name: string; flag: number },
        posData: { pos: Vector3; rot: Vector3 },
    ) => {
        try {
            removeObject();
        } catch (e) {}

        native.requestModel(alt.hash(data.prop));
        if (native.hasModelLoaded(alt.hash(data.prop))) {
            createdObject = native.createObject(
                alt.hash(data.prop),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                true,
                true,
                true,
            );

            native.attachEntityToEntity(
                createdObject,
                alt.Player.local.scriptID,
                native.getPedBoneIndex(alt.Player.local, data.boneId),
                +posData.pos.y,
                +posData.pos.x,
                +posData.pos.z,
                +posData.rot.x,
                +posData.rot.y,
                +posData.rot.z,
                false,
                true,
                false,
                false,
                1,
                true,
            );
        }
    },
);
view.on(
    AttachmentEditorEvents.inputChanged,
    (
        data: {
            prop: string;
            boneId: number;
            dict: string;
            name: string;
            flag: number;
        },
        posData: { pos: Vector3; rot: Vector3 },
    ) => {
        try {
            removeObject();
        } catch (e) {}
        alt.logWarning(JSON.stringify(data));
        alt.logWarning(JSON.stringify(posData));
        native.requestModel(alt.hash(data.prop));
        if (native.hasModelLoaded(alt.hash(data.prop))) {
            createdObject = native.createObject(
                alt.hash(data.prop),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                true,
                true,
                true,
            );

            native.attachEntityToEntity(
                createdObject,
                alt.Player.local.scriptID,
                native.getPedBoneIndex(alt.Player.local, data.boneId),
                +posData.pos.x,
                +posData.pos.y,
                +posData.pos.z,
                +posData.rot.x,
                +posData.rot.y,
                +posData.rot.z,
                false,
                true,
                true,
                false,
                1,
                true,
            );
        }
    },
);

function removeObject() {
    if (createdObject) {
        native.detachEntity(createdObject, true, true);
        native.deleteObject(createdObject);
    } else {
        return;
    }
}
alt.on('keydown', (key) => {
    if (key === 123 && !alt.Player.local.hasMeta('AttachmentEditor')) {
        alt.Player.local.setMeta('AttachmentEditor', true);
        InternalFunctions.open();
    } else if (key === 123 && alt.Player.local.hasMeta('AttachmentEditor')) {
        InternalFunctions.close();
        alt.Player.local.deleteMeta('AttachmentEditor');
    }
});
