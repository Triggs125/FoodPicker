//
//  PageViewModel.swift
//  FoodPicker
//
//  Created by Tanner Driggers on 1/25/22.
//

import Foundation

final class PageViewModel: ObservableObject {

    final var lobby: String = "Lobby"
    final var account: String = "Account"
    
    @Published var page: String = "Lobby"
    @Published var pageTitle: String = "Good evening"
    
    func changeToAccountPage() {
        page = account
        pageTitle = account
    }
    
    func changeToLobbyPage() {
        page = lobby
        pageTitle = lobby
    }
}
