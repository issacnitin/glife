//
//  Engine.m
//  Glimpse
//
//  Created by Nitin Issac Joy on 12/07/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(Engine, NSObject)
  RCT_EXTERN_METHOD(getAllTripsWithData: resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
  RCT_EXTERN_METHOD(getTrip: (NSInteger)tripId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
  RCT_EXTERN_METHOD(getProfileData: (NSInteger)tripId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end