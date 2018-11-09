import {
  default as computed,
  observes
} from "ember-addons/ember-computed-decorators";
import { url } from "discourse/lib/computed";
import { popupAjaxError } from "discourse/lib/ajax-error";
import showModal from "discourse/lib/show-modal";
import ThemeSettings from "admin/models/theme-settings";
import { THEMES, COMPONENTS } from "admin/models/theme";
import { escapeExpression } from "discourse/lib/utilities";

const THEME_UPLOAD_VAR = 2;

export default Ember.Controller.extend({
  downloadUrl: url("model.id", "/admin/themes/%@"),
  previewUrl: url("model.id", "/admin/themes/%@/preview"),
  addButtonDisabled: Em.computed.empty("selectedChildThemeId"),
  editRouteName: "adminCustomizeThemes.edit",

  @computed("model.editedFields")
  editedFieldsFormatted() {
    const descriptions = [];
    ["common", "desktop", "mobile"].forEach(target => {
      const fields = this.editedFieldsForTarget(target);
      if (fields.length < 1) {
        return;
      }
      let resultString = I18n.t("admin.customize.theme." + target);
      const formattedFields = fields
        .map(f => I18n.t("admin.customize.theme." + f.name + ".text"))
        .join(" , ");
      resultString += `: ${formattedFields}`;
      descriptions.push(resultString);
    });
    return descriptions;
  },

  @computed("colorSchemeId", "model.color_scheme_id")
  colorSchemeChanged(colorSchemeId, existingId) {
    colorSchemeId = colorSchemeId === null ? null : parseInt(colorSchemeId);
    return colorSchemeId !== existingId;
  },

  @computed("allThemes", "model.component")
  availableComponents(allThemes, component) {
    return component ? [] : allThemes.filterBy("component", true);
  },

  @computed("availableComponents.[]", "model.selectableComponents.[]")
  activeComponentsList(available, selectableList) {
    return available.filter(theme => !selectableList.includes(theme));
  },

  @computed("availableComponents.[]", "model.activeComponents.[]")
  selectableComponentsList(available, activeList) {
    return available.filter(theme => !activeList.includes(theme));
  },

  @observes("model.activeComponents.[]", "activeComponentsList")
  updateActiveComponentsIds() {
    if (!this.get("model.component")) {
      this.set(
        "activeComponentsIds",
        this.get("model.activeComponents").mapBy("id")
      );
    }
  },

  @observes("model.selectableComponents.[]", "selectableComponentsList")
  updateSelectableComponentsIds() {
    if (!this.get("model.component")) {
      this.set(
        "selectableComponentsIds",
        this.get("model.selectableComponents").mapBy("id")
      );
    }
  },

  @computed("model.component")
  convertKey(component) {
    const type = component ? "component" : "theme";
    return `admin.customize.theme.convert_${type}`;
  },

  @computed("model.component")
  convertIcon(component) {
    return component ? "cube" : "";
  },

  @computed("model.component")
  convertTooltip(component) {
    const type = component ? "component" : "theme";
    return `admin.customize.theme.convert_${type}_tooltip`;
  },

  @computed("model.settings")
  settings(settings) {
    return settings.map(setting => ThemeSettings.create(setting));
  },

  @computed("settings")
  hasSettings(settings) {
    return settings.length > 0;
  },

  @computed("model.remoteError", "updatingRemote")
  showRemoteError(errorMessage, updating) {
    return errorMessage && !updating;
  },

  @computed("addedComponents.length", "removedComponents.length")
  hasEditedComponents(added, removed) {
    return added > 0 || removed > 0;
  },

  editedFieldsForTarget(target) {
    return this.get("model.editedFields").filter(
      field => field.target === target
    );
  },

  commitSwitchType() {
    const model = this.get("model");
    const switchToComponent = !model.get("component");
    const parents = model.get("parentThemes");
    const children = model.get("allComponents");

    model.switchType(switchToComponent);
    this.set("colorSchemeId", null);

    model.saveChanges("component").then(() => {
      if (switchToComponent) {
        children.forEach(child =>
          child.get("parentThemes").removeObject(model)
        );
        this.set("parentController.currentTab", COMPONENTS);
      } else {
        parents.forEach(parent => parent.removeComponent(model));
        this.set("parentController.currentTab", THEMES);
      }
    });
  },

  discardComponentsChanges() {
    this.get("addedComponents").forEach(added => {
      this.get("model").removeComponent(
        this.get("allThemes").findBy("id", added.id)
      );
    });
    this.get("removedComponents").forEach(removed => {
      this.get("model").addComponent(
        this.get("allThemes").findBy("id", removed.id),
        removed.selectable
      );
    });
    this.setProperties({
      addedComponents: [],
      removedComponents: []
    });
  },

  transitionToEditRoute() {
    this.transitionToRoute(
      this.get("editRouteName"),
      this.get("model.id"),
      "common",
      "scss"
    );
  },
  actions: {
    updateToLatest() {
      this.set("updatingRemote", true);
      this.get("model")
        .updateToLatest()
        .catch(popupAjaxError)
        .finally(() => {
          this.set("updatingRemote", false);
        });
    },

    checkForThemeUpdates() {
      this.set("updatingRemote", true);
      this.get("model")
        .checkForUpdates()
        .catch(popupAjaxError)
        .finally(() => {
          this.set("updatingRemote", false);
        });
    },

    addUploadModal() {
      showModal("admin-add-upload", { admin: true, name: "" });
    },

    addUpload(info) {
      let model = this.get("model");
      model.setField("common", info.name, "", info.upload_id, THEME_UPLOAD_VAR);
      model.saveChanges("theme_fields").catch(e => popupAjaxError(e));
    },

    cancelChangeScheme() {
      this.set("colorSchemeId", this.get("model.color_scheme_id"));
    },
    changeScheme() {
      let schemeId = this.get("colorSchemeId");
      this.set(
        "model.color_scheme_id",
        schemeId === null ? null : parseInt(schemeId)
      );
      this.get("model").saveChanges("color_scheme_id");
    },
    startEditingName() {
      this.set("oldName", this.get("model.name"));
      this.set("editingName", true);
    },
    cancelEditingName() {
      this.set("model.name", this.get("oldName"));
      this.set("editingName", false);
    },
    finishedEditingName() {
      this.get("model").saveChanges("name");
      this.set("editingName", false);
    },

    editTheme() {
      if (this.get("model.remote_theme")) {
        bootbox.confirm(
          I18n.t("admin.customize.theme.edit_confirm"),
          result => {
            if (result) {
              this.transitionToEditRoute();
            }
          }
        );
      } else {
        this.transitionToEditRoute();
      }
    },

    applyDefault() {
      const model = this.get("model");
      model.saveChanges("default").then(() => {
        if (model.get("default")) {
          this.get("allThemes").forEach(theme => {
            if (theme !== model && theme.get("default")) {
              theme.set("default", false);
            }
          });
        }
      });
    },

    applyUserSelectable() {
      this.get("model").saveChanges("user_selectable");
    },

    removeUpload(upload) {
      return bootbox.confirm(
        I18n.t("admin.customize.theme.delete_upload_confirm"),
        I18n.t("no_value"),
        I18n.t("yes_value"),
        result => {
          if (result) {
            this.get("model").removeField(upload);
          }
        }
      );
    },

    destroy() {
      return bootbox.confirm(
        I18n.t("admin.customize.delete_confirm"),
        I18n.t("no_value"),
        I18n.t("yes_value"),
        result => {
          if (result) {
            const model = this.get("model");
            model.destroyRecord().then(() => {
              model
                .get("parentThemes")
                .forEach(parent => parent.removeComponent(model));
              this.get("allThemes").removeObject(model);
              this.transitionToRoute("adminCustomizeThemes");
            });
          }
        }
      );
    },

    addComponent(selectable, id) {
      const obj = this.get("removedComponents").find(
        c => c.id === id && c.selectable === selectable
      );
      if (obj) {
        this.get("removedComponents").removeObject(obj);
      } else {
        this.get("addedComponents").pushObject({ id, selectable });
      }
      this.get("model").addComponent(
        this.get("allThemes").findBy("id", id),
        selectable
      );
    },

    removeComponent(selectable, id) {
      const obj = this.get("addedComponents").find(
        c => c.id === id && c.selectable === selectable
      );
      if (obj) {
        this.get("addedComponents").removeObject(obj);
      } else {
        this.get("removedComponents").pushObject({ id, selectable });
      }
      this.get("model").removeComponent(this.get("allThemes").findBy("id", id));
    },

    saveComponents() {
      return this.get("model")
        .saveComponents(
          this.get("addedComponents"),
          this.get("removedComponents")
        )
        .then(() => {
          this.setProperties({
            addedComponents: [],
            removedComponents: []
          });
        });
    },

    cancelComponentsChanges() {
      this.discardComponentsChanges();
    },

    switchType() {
      const relatives = this.get("model.component")
        ? this.get("model.parentThemes")
        : this.get("model.allComponents");
      if (relatives && relatives.length > 0) {
        const names = relatives.map(relative =>
          escapeExpression(relative.get("name"))
        );
        bootbox.confirm(
          I18n.t(`${this.get("convertKey")}_alert`, {
            relatives: names.join(", ")
          }),
          I18n.t("no_value"),
          I18n.t("yes_value"),
          result => {
            if (result) {
              this.commitSwitchType();
            }
          }
        );
      } else {
        this.commitSwitchType();
      }
    }
  }
});
