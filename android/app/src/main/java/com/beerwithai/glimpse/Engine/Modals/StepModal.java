package com.beerwithai.glimpse.Engine.Modals;


import com.beerwithai.glimpse.Engine.Utils.ClusterProcessor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.realm.RealmList;
import io.realm.RealmObject;

public class StepModal extends RealmObject {
    public String profileId;
    public String tripId;
    public Integer stepId;
    public String stepName;
    public Float meanLatitude;
    public Float meanLongitude;
    public Double startTimestamp;
    public Double endTimestamp;
    public RealmList<String> images;
    public RealmList<Region> markers;
    public String masterImage;
    public Integer distanceTravelled;
    public String desc;
    public String temperature;

    public void CopyConstructor(StepModal step) {
        this.stepName = step.stepName;
        this.meanLatitude = step.meanLatitude;
        this.meanLongitude = step.meanLongitude;
        this.startTimestamp = step.startTimestamp;
        this.endTimestamp = step.endTimestamp;
        this.images = step.images;
        this.markers = step.markers;
        this.masterImage = step.masterImage;
        this.distanceTravelled = step.distanceTravelled;
        this.desc = step.desc;
        this.temperature  = step.temperature;
    }

    public Integer GetDistanceBetween(StepModal a) {

        ClusterModal _p = new ClusterModal();
        _p.latitude = a.meanLatitude;
        _p.longitude = a.meanLongitude;

        ClusterModal _q = new ClusterModal();
        _q.latitude = this.meanLatitude;
        _q.longitude = this.meanLongitude;

        return (ClusterProcessor.EarthDistance(_p, _q));
    }

    public Map<String, Object> GetAsDictionary() {
        Map<String, Object> obj = new HashMap<String, Object>();
        obj.put("profileId", this.profileId);
        obj.put("tripId", this.tripId);
        obj.put("stepId", this.stepId);
        obj.put("stepName", this.stepName);
        obj.put("meanLatitude", this.meanLatitude);
        obj.put("meanLongitude", this.meanLongitude);
        obj.put("startTimestamp", this.startTimestamp);
        obj.put("endTimestamp", this.endTimestamp);
        obj.put("masterImage", this.masterImage);
        obj.put("masterMarker", this.markers.get(0).GetAsDictionary());
        obj.put("distanceTravelled", this.distanceTravelled);
        obj.put("desc", this.desc);
        obj.put("temperature", this.temperature);
        obj.put("numberOfPicturesTaken", this.images.size());
        return obj;
    }
}